package com.workfora.asset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
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
class AssetApiIntegrationTest {

    private static final String ALEX = "66666666-6666-6666-6666-666666666661";
    private static final String JAMIE = "66666666-6666-6666-6666-666666666663";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void assignmentIsVisibleAndHistoryKeepsThePreviousHolder() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String id = createAsset(admin, tag("laptop"), "Laptop", null);

        mockMvc.perform(get("/api/v1/assets").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].currentAssignment").doesNotExist())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].status").value("AVAILABLE"));

        assign(admin, id, JAMIE, "Desk setup");

        mockMvc.perform(get("/api/v1/assets").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].currentAssignment.fullName").value("Jamie Employee"))
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].currentAssignment.employeeNumber").value("EMP-0003"))
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].status").value("ASSIGNED"));

        mockMvc.perform(post("/api/v1/assets/" + id + "/return").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/assets").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].currentAssignment").doesNotExist())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].status").value("AVAILABLE"));

        mockMvc.perform(get("/api/v1/assets/" + id + "/history").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentAssignment").doesNotExist())
                .andExpect(jsonPath("$.data.events[?(@.type == 'ASSIGNED')].employeeName").value("Jamie Employee"))
                .andExpect(jsonPath("$.data.events[?(@.type == 'ASSIGNED')].notes").value("Desk setup"))
                .andExpect(jsonPath("$.data.events[?(@.type == 'RETURNED')].employeeNumber").value("EMP-0003"))
                .andExpect(jsonPath("$.data.events[?(@.type == 'CREATED')]").exists());
    }

    @Test
    void editChangesOnlySubmittedFieldsAndRejectsADuplicateTag() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String categoryId = createCategory(admin, "Laptops " + UUID.randomUUID());
        String updatedTag = tag("dock");
        String first = createAsset(admin, tag("dock"), "Dock", null);
        String other = tag("monitor");
        createAsset(admin, other, "Monitor", null);

        mockMvc.perform(put("/api/v1/assets/" + first)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assetJson(updatedTag, "USB-C dock", categoryId, "SN-1", "2024-04-01", "89.50", "Spare")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("USB-C dock"))
                .andExpect(jsonPath("$.data.assetTag").value(updatedTag))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.data.serialNumber").value("SN-1"));

        mockMvc.perform(get("/api/v1/assets/" + first + "/history").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data.events[?(@.field == 'name')].previousValue").value("Dock"))
                .andExpect(jsonPath("$.data.events[?(@.field == 'name')].newValue").value("USB-C dock"))
                .andExpect(jsonPath("$.data.events[?(@.field == 'category')].newValue").value(hasItem(containsString("Laptops"))));

        mockMvc.perform(put("/api/v1/assets/" + first)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assetJson(other, "USB-C dock", categoryId, "SN-1", "2024-04-01", "89.50", "Spare")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("An asset with this tag already exists in the organization"));
    }

    @Test
    void assignedAssetCannotBeArchivedAndHistoryRemainsAfterArchive() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String id = createAsset(admin, tag("phone"), "Phone", null);
        assign(admin, id, ALEX, null);

        mockMvc.perform(delete("/api/v1/assets/" + id).header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Return the asset before archiving it"));

        mockMvc.perform(post("/api/v1/assets/" + id + "/return").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/v1/assets/" + id).header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.archivedAt").isNotEmpty());

        mockMvc.perform(get("/api/v1/assets").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')]").isEmpty());
        mockMvc.perform(get("/api/v1/assets").param("archived", "true").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].name").value("Phone"));
        mockMvc.perform(get("/api/v1/assets/" + id + "/history").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data.events[?(@.type == 'ARCHIVED')]").exists())
                .andExpect(jsonPath("$.data.events[?(@.type == 'ASSIGNED')].employeeNumber").value("EMP-0001"));
    }

    @Test
    void bulkOperationsReportEachAssetAndLeaveOtherFieldsAlone() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String categoryId = createCategory(admin, "Furniture " + UUID.randomUUID());
        String available = createAsset(admin, tag("chair"), "Chair", null);
        String assigned = createAsset(admin, tag("desk"), "Desk", null);
        assign(admin, assigned, JAMIE, null);

        MvcResult categoryUpdate = mockMvc.perform(patch("/api/v1/assets/bulk")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":["%s","%s"],"categoryId":"%s","clearCategory":false}
                                """.formatted(available, assigned, categoryId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.succeeded").value(2))
                .andExpect(jsonPath("$.data.failed").value(0))
                .andReturn();
        assertThat(categoryUpdate.getResponse().getContentAsString()).contains("Category updated");

        mockMvc.perform(get("/api/v1/assets").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data[?(@.id == '" + available + "')].categoryId").value(categoryId))
                .andExpect(jsonPath("$.data[?(@.id == '" + available + "')].name").value("Chair"))
                .andExpect(jsonPath("$.data[?(@.id == '" + available + "')].assetTag").isNotEmpty())
                .andExpect(jsonPath("$.data[?(@.id == '" + assigned + "')].status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data[?(@.id == '" + assigned + "')].categoryId").value(categoryId));

        mockMvc.perform(post("/api/v1/assets/bulk/assign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":["%s","%s"],"employeeId":"%s","notes":"Floor move"}
                                """.formatted(available, assigned, ALEX)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.succeeded").value(1))
                .andExpect(jsonPath("$.data.failed").value(1))
                .andExpect(jsonPath("$.data.items[?(@.id == '" + assigned + "')].message").value("Asset is not available"));

        mockMvc.perform(get("/api/v1/assets").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.data[?(@.id == '" + available + "')].currentAssignment.employeeNumber").value("EMP-0001"))
                .andExpect(jsonPath("$.data[?(@.id == '" + assigned + "')].currentAssignment.employeeNumber").value("EMP-0003"));

        mockMvc.perform(post("/api/v1/assets/" + available + "/return").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/assets/bulk/archive")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ids":["%s","%s"]}
                                """.formatted(available, assigned)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.succeeded").value(1))
                .andExpect(jsonPath("$.data.failed").value(1))
                .andExpect(jsonPath("$.data.items[?(@.id == '" + assigned + "')].message").value("Return the asset before archiving it"))
                .andExpect(jsonPath("$.data.items[?(@.id == '" + available + "')].success").value(true));
    }

    @Test
    void writeRequiresPermissionAndStaysInsideTheOrganization() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String employee = login("employee@workfora.com", "Admin123!");
        String id = createAsset(admin, tag("badge"), "Badge", null);

        mockMvc.perform(post("/api/v1/assets")
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assetJson(tag("nope"), "Nope", null, null, null, null, null)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/assets/" + id + "/history").header("Authorization", "Bearer " + employee))
                .andExpect(status().isForbidden());

        String outsider = verifiedOrgAdmin();
        mockMvc.perform(get("/api/v1/assets/" + id + "/history").header("Authorization", "Bearer " + outsider))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/assets/" + id)
                        .header("Authorization", "Bearer " + outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assetJson(tag("stolen"), "Stolen", null, null, null, null, null)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/assets/" + id + "/assign")
                        .header("Authorization", "Bearer " + outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"employeeId":"%s"}
                                """.formatted(JAMIE)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/assets/" + id + "/assign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"employeeId":"%s"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Employee was not found in this organization"));
    }

    @Test
    void historyFeedIsAnOrganizationTimeline() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String id = createAsset(admin, tag("feed"), "Feed Laptop", null);
        assign(admin, id, JAMIE, "Issued");
        mockMvc.perform(post("/api/v1/assets/" + id + "/return").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/assets/history")
                        .param("assetId", id)
                        .param("size", "20")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.event.type == 'CREATED')].assetName").value(hasItem("Feed Laptop")))
                .andExpect(jsonPath("$.data[?(@.event.type == 'ASSIGNED')].event.employeeNumber").value(hasItem("EMP-0003")))
                .andExpect(jsonPath("$.data[?(@.event.type == 'RETURNED')].assetTag").isNotEmpty())
                .andExpect(jsonPath("$.meta.totalElements").value(3));

        mockMvc.perform(get("/api/v1/assets/history")
                        .param("assetId", id)
                        .param("type", "ASSIGNED")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.meta.totalElements").value(1));

        String employee = login("employee@workfora.com", "Admin123!");
        mockMvc.perform(get("/api/v1/assets/history").header("Authorization", "Bearer " + employee))
                .andExpect(status().isForbidden());

        String outsider = verifiedOrgAdmin();
        mockMvc.perform(get("/api/v1/assets/history")
                        .param("assetId", id)
                        .header("Authorization", "Bearer " + outsider))
                .andExpect(status().isNotFound());
    }

    @Test
    void categoryCanBeRenamedAndDeletedWhenUnused() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String employee = login("employee@workfora.com", "Admin123!");
        String name = "Monitors " + UUID.randomUUID();
        String renamed = "Displays " + UUID.randomUUID();
        String taken = "Spare " + UUID.randomUUID();
        String categoryId = createCategory(admin, name);
        String otherId = createCategory(admin, "Spare " + UUID.randomUUID());

        mockMvc.perform(put("/api/v1/assets/categories/" + categoryId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","description":"Screens"}
                                """.formatted(renamed)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value(renamed))
                .andExpect(jsonPath("$.data.description").value("Screens"));

        mockMvc.perform(put("/api/v1/assets/categories/" + categoryId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","description":"Taken"}
                                """.formatted(taken)))
                .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/assets/categories/" + otherId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s"}
                                """.formatted(taken)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("A category with this name already exists in the organization"));

        String assetId = createAsset(admin, tag("screen"), "Screen", categoryId);
        mockMvc.perform(delete("/api/v1/assets/categories/" + categoryId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Remove this category from its assets before deleting it"));

        mockMvc.perform(put("/api/v1/assets/" + assetId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assetJson(tag("screen-free"), "Screen", null, null, null, null, null)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/assets/categories/" + categoryId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/assets/categories").param("size", "100").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + categoryId + "')]").isEmpty());

        mockMvc.perform(put("/api/v1/assets/categories/" + categoryId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Gone"}
                                """))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/assets/categories/" + UUID.randomUUID()).header("Authorization", "Bearer " + admin))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/assets/categories/" + otherId)
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Nope"}
                                """))
                .andExpect(status().isForbidden());

        String outsider = verifiedOrgAdmin();
        mockMvc.perform(delete("/api/v1/assets/categories/" + otherId).header("Authorization", "Bearer " + outsider))
                .andExpect(status().isNotFound());
    }

    @Test
    void concurrentAssignmentLeavesASingleOpenAssignment() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");
        String id = createAsset(admin, tag("key"), "Office key", null);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Integer> first = pool.submit(() -> assignStatus(admin, id, ready, start));
            Future<Integer> second = pool.submit(() -> assignStatus(admin, id, ready, start));
            ready.await();
            start.countDown();
            int left = first.get();
            int right = second.get();
            assertThat(left).isIn(200, 400);
            assertThat(right).isIn(200, 400);
            assertThat(left == 200 || right == 200).isTrue();
            assertThat(left == 200 && right == 200).isFalse();
        } finally {
            pool.shutdownNow();
        }

        mockMvc.perform(get("/api/v1/assets/" + id + "/history").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentAssignment.employeeNumber").value("EMP-0001"))
                .andExpect(jsonPath("$.data.events[?(@.type == 'ASSIGNED')]").exists());
    }

    private int assignStatus(String token, String assetId, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        start.await();
        return mockMvc.perform(post("/api/v1/assets/" + assetId + "/assign")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"employeeId":"%s"}
                                """.formatted(ALEX)))
                .andReturn()
                .getResponse()
                .getStatus();
    }

    private String createAsset(String token, String assetTag, String name, String categoryId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/assets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assetJson(assetTag, name, categoryId, null, null, null, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentAssignment").doesNotExist())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText();
    }

    private String createCategory(String token, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/assets/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","description":"Equipment"}
                                """.formatted(name)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText();
    }

    private void assign(String token, String assetId, String employeeId, String notes) throws Exception {
        String noteJson = notes == null ? "null" : "\"" + notes + "\"";
        mockMvc.perform(post("/api/v1/assets/" + assetId + "/assign")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"employeeId":"%s","notes":%s}
                                """.formatted(employeeId, noteJson)))
                .andExpect(status().isOk());
    }

    private String verifiedOrgAdmin() throws Exception {
        String email = "asset-" + UUID.randomUUID() + "@example.com";
        MvcResult registration = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Asset Org " + UUID.randomUUID())))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(registration.getResponse().getContentAsString()).path("data");
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(data.path("developmentVerificationToken").asText())))
                .andExpect(status().isOk());
        return login(email, "Admin123!");
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("accessToken").asText();
    }

    private static String tag(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private static String assetJson(
            String assetTag,
            String name,
            String categoryId,
            String serialNumber,
            String purchaseDate,
            String purchaseCost,
            String notes
    ) {
        return """
                {
                  "assetTag":"%s",
                  "name":"%s",
                  "categoryId":%s,
                  "serialNumber":%s,
                  "purchaseDate":%s,
                  "purchaseCost":%s,
                  "notes":%s
                }
                """.formatted(
                assetTag,
                name,
                json(categoryId),
                json(serialNumber),
                json(purchaseDate),
                purchaseCost == null ? "null" : purchaseCost,
                json(notes)
        );
    }

    private static String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private static String registrationJson(String email, String orgName) {
        return """
                {
                  "account": {
                    "firstName": "Ada",
                    "lastName": "Lovelace",
                    "email": "%s",
                    "password": "Admin123!",
                    "confirmPassword": "Admin123!",
                    "acceptTerms": true
                  },
                  "organization": {
                    "name": "%s",
                    "companyEmail": "%s",
                    "industry": "Technology",
                    "companySize": "11-50",
                    "country": "US",
                    "timezone": "UTC"
                  }
                }
                """.formatted(email, orgName, email);
    }
}
