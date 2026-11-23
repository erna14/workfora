package com.workfora.attendance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AttendanceApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Order(1)
    void checkInCheckOutAndBreakFlowSucceeds() throws Exception {
        String token = login("employee@workfora.com");
        ensureCheckedOut(token);

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkInAt").isNotEmpty())
                .andExpect(jsonPath("$.data.sessionState").value("WORKING"));

        mockMvc.perform(get("/api/v1/attendance/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionState").value("WORKING"))
                .andExpect(jsonPath("$.data.record.checkInAt").isNotEmpty());

        mockMvc.perform(post("/api/v1/attendance/break/start")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionState").value("ON_BREAK"));

        mockMvc.perform(post("/api/v1/attendance/break/end")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionState").value("WORKING"));

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionState").value("COMPLETED"))
                .andExpect(jsonPath("$.data.checkOutAt").isNotEmpty())
                .andExpect(jsonPath("$.data.netWorkSeconds").isNumber());
    }

    @Test
    @Order(2)
    void duplicateCheckInIsRejected() throws Exception {
        String token = login("manager@workfora.com");
        ensureCheckedOut(token);

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        ensureCheckedOut(token);
    }

    @Test
    @Order(3)
    void checkOutWithoutActiveSessionFails() throws Exception {
        String token = login("admin@workfora.com");
        ensureCheckedOut(token);

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    void employeeCannotViewOtherEmployeeAttendance() throws Exception {
        String employeeToken = login("employee@workfora.com");
        String managerToken = login("manager@workfora.com");

        MvcResult history = mockMvc.perform(get("/api/v1/attendance/history?page=0&size=5")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode records = objectMapper.readTree(history.getResponse().getContentAsString()).path("data");
        assertThat(records.isArray()).isTrue();
        assertThat(records.size()).isGreaterThan(0);
        String attendanceId = records.get(0).path("id").asText();

        mockMvc.perform(get("/api/v1/attendance/" + attendanceId)
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    void concurrentCheckInAllowsOnlyOneSuccess() throws Exception {
        String token = login("admin@workfora.com");
        ensureCheckedOut(token);

        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        AtomicInteger failures = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                try {
                    start.await(5, TimeUnit.SECONDS);
                    MvcResult result = mockMvc.perform(post("/api/v1/attendance/check-in")
                                    .header("Authorization", "Bearer " + token))
                            .andReturn();
                    if (result.getResponse().getStatus() == 200) {
                        successes.incrementAndGet();
                    } else {
                        failures.incrementAndGet();
                    }
                } catch (Exception e) {
                    failures.incrementAndGet();
                }
            }));
        }

        start.countDown();
        for (Future<?> future : futures) {
            future.get(15, TimeUnit.SECONDS);
        }
        pool.shutdownNow();

        assertThat(successes.get()).isEqualTo(1);
        assertThat(failures.get()).isEqualTo(threads - 1);
        ensureCheckedOut(token);
    }

    @Test
    @Order(6)
    void historyEndpointReturnsOwnRecords() throws Exception {
        String token = login("employee@workfora.com");
        mockMvc.perform(get("/api/v1/attendance/history?page=0&size=5&sort=workDate,desc")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    private void ensureCheckedOut(String token) throws Exception {
        mockMvc.perform(post("/api/v1/attendance/check-out")
                .header("Authorization", "Bearer " + token));
    }

    private String login(String email) throws Exception {
        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Admin123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(login.getResponse().getContentAsString());
        return root.path("data").path("accessToken").asText();
    }
}
