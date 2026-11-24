package com.workfora.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workfora.identity.domain.UserAccount;
import com.workfora.identity.repository.UserAccountRepository;
import com.workfora.organization.domain.MembershipStatus;
import com.workfora.organization.repository.OrganizationMembershipRepository;
import com.workfora.organization.repository.OrganizationRepository;
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
class OrganizationRegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    @Test
    void registersOrganizationAndAssignsOrgAdmin() throws Exception {
        String email = "owner-" + UUID.randomUUID() + "@example.com";
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Acme Robotics")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.emailVerificationRequired").value(true))
                .andExpect(jsonPath("$.data.developmentVerificationToken").isNotEmpty())
                .andExpect(jsonPath("$.data.organizationSlug").value("acme-robotics"))
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        UUID userId = UUID.fromString(data.path("userId").asText());
        UUID orgId = UUID.fromString(data.path("organizationId").asText());

        UserAccount user = userAccountRepository.findWithRolesById(userId).orElseThrow();
        assertThat(user.isEmailVerified()).isFalse();
        assertThat(user.isEnabled()).isFalse();
        assertThat(user.getOrganizationId()).isEqualTo(orgId);
        assertThat(user.getRoles()).extracting("code").containsExactly("ORG_ADMIN");
        assertThat(user.getRoles().stream().flatMap(r -> r.getPermissions().stream()).map(p -> p.getCode()))
                .doesNotContain("platform:manage");

        assertThat(membershipRepository.findByUserIdAndOrganizationId(userId, orgId))
                .isPresent()
                .get()
                .satisfies(m -> {
                    assertThat(m.getRoleCode()).isEqualTo("ORG_ADMIN");
                    assertThat(m.getStatus()).isEqualTo(MembershipStatus.ACTIVE);
                });

        assertThat(organizationRepository.findById(orgId)).isPresent();
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Dup Co One")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Dup Co Two")))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsInvalidRegistrationData() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "account": {
                                    "firstName": "A",
                                    "lastName": "B",
                                    "email": "not-an-email",
                                    "password": "short",
                                    "confirmPassword": "short",
                                    "acceptTerms": false
                                  },
                                  "organization": {
                                    "name": "X",
                                    "companyEmail": "bad",
                                    "industry": "",
                                    "companySize": "",
                                    "country": "",
                                    "timezone": ""
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void allocatesUniqueSlugOnCollision() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String name = "Slug Collision " + suffix;
        mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("slug1-" + suffix + "@example.com", name)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.organizationSlug").value("slug-collision-" + suffix));

        mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson("slug2-" + suffix + "@example.com", name)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.organizationSlug").value("slug-collision-" + suffix + "-2"));
    }

    @Test
    void verifiesEmailAndAllowsLoginAsOrgAdmin() throws Exception {
        String email = "verify-" + UUID.randomUUID() + "@example.com";
        MvcResult reg = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Verify Org")))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(reg.getResponse().getContentAsString())
                .path("data").path("developmentVerificationToken").asText();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Admin123!"}
                                """.formatted(email)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verified").value(true));

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(token)))
                .andExpect(status().isBadRequest());

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Admin123!"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.roles[0]").value("ORG_ADMIN"))
                .andExpect(jsonPath("$.data.user.organizationId").isNotEmpty())
                .andReturn();

        String accessToken = objectMapper.readTree(login.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roles[0]").value("ORG_ADMIN"));
    }

    @Test
    void expiredOrUnknownTokenFails() throws Exception {
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendVerificationIsGenericAndWorksForUnverified() throws Exception {
        String email = "resend-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Resend Org")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").isNotEmpty())
                .andExpect(jsonPath("$.data.developmentVerificationToken").isNotEmpty());

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"missing-%s@example.com"}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").isNotEmpty());
    }

    @Test
    void registrationCannotAssignPlatformAdmin() throws Exception {
        String email = "priv-" + UUID.randomUUID() + "@example.com";
        // Even if a client tried to smuggle roles, the API only accepts account/org/setup payloads.
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(email, "Priv Guard Co")))
                .andExpect(status().isOk())
                .andReturn();

        UUID userId = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("userId").asText());
        UserAccount user = userAccountRepository.findWithRolesById(userId).orElseThrow();
        assertThat(user.getRoles()).extracting("code")
                .containsExactly("ORG_ADMIN")
                .doesNotContain("SUPER_ADMIN");
    }

    @Test
    void tenantIsolationPreventsCrossOrganizationEmployeeAccess() throws Exception {
        String emailA = "tenant-a-" + UUID.randomUUID() + "@example.com";
        String emailB = "tenant-b-" + UUID.randomUUID() + "@example.com";

        MvcResult regA = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(emailA, "Tenant A Corp")))
                .andExpect(status().isOk())
                .andReturn();
        MvcResult regB = mockMvc.perform(post("/api/v1/auth/register/organization")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registrationJson(emailB, "Tenant B Corp")))
                .andExpect(status().isOk())
                .andReturn();

        String tokenA = objectMapper.readTree(regA.getResponse().getContentAsString())
                .path("data").path("developmentVerificationToken").asText();
        String tokenB = objectMapper.readTree(regB.getResponse().getContentAsString())
                .path("data").path("developmentVerificationToken").asText();

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(tokenA)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(tokenB)))
                .andExpect(status().isOk());

        String accessA = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Admin123!"}
                                """.formatted(emailA)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).path("data").path("accessToken").asText();

        String accessB = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Admin123!"}
                                """.formatted(emailB)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).path("data").path("accessToken").asText();

        MvcResult employeesA = mockMvc.perform(get("/api/v1/employees")
                        .header("Authorization", "Bearer " + accessA))
                .andExpect(status().isOk())
                .andReturn();
        MvcResult employeesB = mockMvc.perform(get("/api/v1/employees")
                        .header("Authorization", "Bearer " + accessB))
                .andExpect(status().isOk())
                .andReturn();

        String bodyA = employeesA.getResponse().getContentAsString();
        String bodyB = employeesB.getResponse().getContentAsString();
        assertThat(bodyA).contains(emailA);
        assertThat(bodyA).doesNotContain(emailB);
        assertThat(bodyB).contains(emailB);
        assertThat(bodyB).doesNotContain(emailA);
    }

    @Test
    void demoAdminStillWorks() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@workfora.com","password":"Admin123!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.email").value("admin@workfora.com"));
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
                    "timezone": "UTC",
                    "website": "https://example.com",
                    "phone": "+1-555-0100"
                  },
                  "setup": {
                    "departments": ["People", "Engineering"],
                    "locations": ["HQ"],
                    "workingDays": ["MON","TUE","WED","THU","FRI"],
                    "workStartTime": "09:00:00",
                    "workEndTime": "17:00:00"
                  }
                }
                """.formatted(email, orgName, email);
    }
}
