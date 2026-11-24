package com.workfora.organization;

import static org.assertj.core.api.Assertions.assertThat;
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
class OrganizationStructureApiIntegrationTest {

    private static final String DEMO_ORG = "11111111-1111-1111-1111-111111111111";
    private static final String DEMO_ENGINEERING = "33333333-3333-3333-3333-333333333331";
    private static final String DEMO_HR = "33333333-3333-3333-3333-333333333332";
    private static final String DEMO_SOFTWARE_ENGINEER = "44444444-4444-4444-4444-444444444441";
    private static final String DEMO_HR_ADMIN = "44444444-4444-4444-4444-444444444442";
    private static final String DEMO_ENGINEERING_MANAGER = "44444444-4444-4444-4444-444444444443";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void demoPositionsBelongToDemoDepartmentsAndAreNotGlobal() throws Exception {
        String admin = login("admin@workfora.com", "Admin123!");

        mockMvc.perform(get("/api/v1/departments")
                        .param("page", "0")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + DEMO_ENGINEERING + "')].name").value("Engineering"))
                .andExpect(jsonPath("$.data[?(@.id == '" + DEMO_HR + "')].organizationId").value(DEMO_ORG));

        MvcResult positions = mockMvc.perform(get("/api/v1/positions")
                        .param("page", "0")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + DEMO_SOFTWARE_ENGINEER + "')].departmentId").value(DEMO_ENGINEERING))
                .andExpect(jsonPath("$.data[?(@.id == '" + DEMO_HR_ADMIN + "')].departmentId").value(DEMO_HR))
                .andExpect(jsonPath("$.data[?(@.id == '" + DEMO_ENGINEERING_MANAGER + "')].organizationId").value(DEMO_ORG))
                .andReturn();

        JsonNode rows = objectMapper.readTree(positions.getResponse().getContentAsString()).path("data");
        assertThat(rows.size()).isGreaterThanOrEqualTo(3);
        for (JsonNode row : rows) {
            assertThat(row.path("organizationId").asText()).isEqualTo(DEMO_ORG);
        }

        mockMvc.perform(get("/api/v1/departments")
                        .param("organizationId", UUID.randomUUID().toString())
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCannotModifyStructure() throws Exception {
        String employee = login("employee@workfora.com", "Admin123!");
        mockMvc.perform(get("/api/v1/departments")
                        .header("Authorization", "Bearer " + employee))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/departments")
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"NOPE","name":"Not Allowed"}
                                """))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/positions")
                        .header("Authorization", "Bearer " + employee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentId":"%s","title":"Not Allowed"}
                                """.formatted(DEMO_ENGINEERING)))
                .andExpect(status().isForbidden());
    }

    @Test
    void organizationsManageDepartmentsAndPositionsInIsolation() throws Exception {
        String emailA = "org-a-" + UUID.randomUUID() + "@example.com";
        String emailB = "org-b-" + UUID.randomUUID() + "@example.com";
        String tokenA = registerAndLogin(emailA, "Organization Alpha");
        String tokenB = registerAndLogin(emailB, "Organization Beta");

        mockMvc.perform(get("/api/v1/positions")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + DEMO_SOFTWARE_ENGINEER + "')]").isEmpty());

        String engineering = createDepartment(tokenA, "ENG", "Engineering");
        String humanResources = createDepartment(tokenA, "HR", "Human Resources");
        String softwareEngineer = createPosition(tokenA, engineering, "Software Engineer", "IC3");
        String engineeringManager = createPosition(tokenA, engineering, "Engineering Manager", "M2");

        mockMvc.perform(get("/api/v1/positions/" + softwareEngineer)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.departmentId").value(engineering))
                .andExpect(jsonPath("$.data.departmentName").value("Engineering"));
        mockMvc.perform(get("/api/v1/positions/" + engineeringManager)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.data.departmentId").value(engineering));

        mockMvc.perform(post("/api/v1/departments")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"PEO","name":"engineering"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("A department with this name already exists in the organization"));

        String sales = createDepartment(tokenB, "SAL", "Sales");
        String marketing = createDepartment(tokenB, "MKT", "Marketing");
        createDepartment(tokenB, "ENG", "Engineering");
        String seller = createPosition(tokenB, sales, "Account Executive", null);

        mockMvc.perform(get("/api/v1/departments")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + engineering + "')]").isEmpty())
                .andExpect(jsonPath("$.data[?(@.id == '" + sales + "')].name").value("Sales"))
                .andExpect(jsonPath("$.data[?(@.id == '" + marketing + "')].name").value("Marketing"));

        mockMvc.perform(get("/api/v1/positions")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.data[?(@.id == '" + seller + "')]").isEmpty());

        mockMvc.perform(get("/api/v1/departments/" + sales)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/departments/" + sales)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"SAL","name":"Hijacked"}
                                """))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/positions")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentId":"%s","title":"Intruder"}
                                """.formatted(sales)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/v1/departments/" + humanResources)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"HR","name":"People","description":"People team","status":"ACTIVE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("People"));

        mockMvc.perform(put("/api/v1/positions/" + softwareEngineer)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentId":"%s","title":"Senior Software Engineer","level":"IC4","status":"ACTIVE"}
                                """.formatted(engineering)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Senior Software Engineer"));

        mockMvc.perform(delete("/api/v1/departments/" + engineering)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("positions")));

        String employeeId = objectMapper.readTree(mockMvc.perform(get("/api/v1/employees")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).path("data").get(0).path("id").asText();

        mockMvc.perform(patch("/api/v1/employees/" + employeeId)
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentId":"%s","positionId":"%s"}
                                """.formatted(engineering, softwareEngineer)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/positions/" + softwareEngineer)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("employees")));

        String temporary = createDepartment(tokenA, "TMP", "Temporary");
        mockMvc.perform(delete("/api/v1/departments/" + temporary)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        String openRole = createPosition(tokenA, humanResources, "Recruiter", null);
        mockMvc.perform(delete("/api/v1/positions/" + openRole)
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/departments/" + marketing + "/status")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"INACTIVE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
        mockMvc.perform(get("/api/v1/departments")
                        .param("status", "ACTIVE")
                        .param("size", "100")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(jsonPath("$.data[?(@.id == '" + marketing + "')]").isEmpty());

        createPosition(tokenA, engineering, "Software Engineer", "IC2");
    }

    private String createDepartment(String token, String code, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/departments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"%s","name":"%s","status":"ACTIVE"}
                                """.formatted(code, name)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText();
    }

    private String createPosition(String token, String departmentId, String title, String level) throws Exception {
        String levelJson = level == null ? "null" : "\"" + level + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/positions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"departmentId":"%s","title":"%s","level":%s,"status":"ACTIVE"}
                                """.formatted(departmentId, title, levelJson)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("id").asText();
    }

    private String registerAndLogin(String email, String organization) throws Exception {
        MvcResult registration = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, organization)))
                .andExpect(status().isOk())
                .andReturn();
        String verificationToken = objectMapper.readTree(registration.getResponse().getContentAsString())
                .path("data")
                .path("developmentVerificationToken")
                .asText();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(verificationToken)))
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
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("accessToken")
                .asText();
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
                  },
                  "setup": {
                    "departments": [],
                    "locations": [],
                    "workingDays": ["MON","TUE","WED","THU","FRI"],
                    "workStartTime": "09:00:00",
                    "workEndTime": "17:00:00"
                  }
                }
                """.formatted(email, orgName, email);
    }
}
