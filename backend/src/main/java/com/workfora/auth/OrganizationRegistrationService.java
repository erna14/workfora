package com.workfora.auth;

import com.workfora.audit.AuditService;
import com.workfora.auth.dto.RegisterOrganizationRequest;
import com.workfora.auth.dto.RegistrationResponse;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.ratelimit.InMemoryRateLimiter;
import com.workfora.common.util.SlugUtils;
import com.workfora.config.WorkforaProperties;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.domain.EmployeeStatus;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.identity.domain.Role;
import com.workfora.identity.domain.UserAccount;
import com.workfora.identity.repository.RoleRepository;
import com.workfora.identity.repository.UserAccountRepository;
import com.workfora.organization.domain.Department;
import com.workfora.organization.domain.Location;
import com.workfora.organization.domain.MembershipStatus;
import com.workfora.organization.domain.Organization;
import com.workfora.organization.domain.OrganizationMembership;
import com.workfora.organization.repository.DepartmentRepository;
import com.workfora.organization.repository.LocationRepository;
import com.workfora.organization.repository.OrganizationMembershipRepository;
import com.workfora.organization.repository.OrganizationRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationRegistrationService {

    public static final String ORG_ADMIN_ROLE = "ORG_ADMIN";

    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final AuditService auditService;
    private final WorkforaProperties properties;
    private final InMemoryRateLimiter rateLimiter;

    public OrganizationRegistrationService(
            OrganizationRepository organizationRepository,
            OrganizationMembershipRepository membershipRepository,
            UserAccountRepository userAccountRepository,
            RoleRepository roleRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            LocationRepository locationRepository,
            PasswordEncoder passwordEncoder,
            EmailVerificationService emailVerificationService,
            AuditService auditService,
            WorkforaProperties properties,
            InMemoryRateLimiter rateLimiter
    ) {
        this.organizationRepository = organizationRepository;
        this.membershipRepository = membershipRepository;
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.locationRepository = locationRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationService = emailVerificationService;
        this.auditService = auditService;
        this.properties = properties;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public RegistrationResponse register(RegisterOrganizationRequest request, String clientKey) {
        String email = request.account().email().trim().toLowerCase(Locale.ROOT);
        String ipKey = clientKey != null && !clientKey.isBlank() ? clientKey : "unknown";
        if (!rateLimiter.tryAcquire("register-ip:" + ipKey, 60, 3600)) {
            throw new BusinessException("Too many registration attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
        }
        if (!rateLimiter.tryAcquire("register-email:" + email, 5, 3600)) {
            throw new BusinessException("Too many registration attempts for this email. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
        }

        if (userAccountRepository.existsByEmailIgnoreCase(email)
                || employeeRepository.existsByWorkEmailIgnoreCase(email)) {
            throw new BusinessException("An account with this email already exists", HttpStatus.CONFLICT);
        }

        Organization organization = createOrganization(request);
        Employee employee = createOwnerEmployee(organization, request);
        UserAccount user = createOwnerUser(organization, employee, request, email);
        createMembership(user, organization);
        applyOptionalSetup(organization, request.setup());

        String rawToken = emailVerificationService.issueToken(user);
        emailVerificationService.sendVerificationEmailAfterCommit(user, rawToken);

        auditService.log(
                "ORGANIZATION_REGISTERED",
                "Organization",
                organization.getId(),
                "Organization '%s' registered by %s as ORG_ADMIN".formatted(organization.getName(), email)
        );

        boolean exposeToken = properties.getRegistration().isExposeVerificationToken();
        return new RegistrationResponse(
                organization.getId(),
                organization.getSlug(),
                organization.getName(),
                user.getId(),
                user.getEmail(),
                true,
                "Registration successful. Please verify your email to activate your workspace.",
                exposeToken ? rawToken : null
        );
    }

    private Organization createOrganization(RegisterOrganizationRequest request) {
        var orgPayload = request.organization();
        Organization organization = new Organization();
        organization.setName(orgPayload.name().trim());
        organization.setLegalName(orgPayload.name().trim());
        organization.setSlug(uniqueSlug(orgPayload.name()));
        organization.setCompanyEmail(orgPayload.companyEmail().trim().toLowerCase(Locale.ROOT));
        organization.setIndustry(orgPayload.industry().trim());
        organization.setCompanySize(orgPayload.companySize().trim());
        organization.setCountry(orgPayload.country().trim());
        organization.setTimezone(orgPayload.timezone().trim());
        organization.setWebsite(blankToNull(orgPayload.website()));
        organization.setPhone(blankToNull(orgPayload.phone()));
        organization.setDefaultCurrency(defaultCurrencyForCountry(orgPayload.country()));
        organization.setWorkingDays("MON,TUE,WED,THU,FRI");
        organization.setWorkStartTime(LocalTime.of(9, 0));
        organization.setWorkEndTime(LocalTime.of(17, 0));

        if (request.setup() != null) {
            if (request.setup().workingDays() != null && !request.setup().workingDays().isEmpty()) {
                organization.setWorkingDays(String.join(",", request.setup().workingDays()).toUpperCase(Locale.ROOT));
            }
            if (request.setup().workStartTime() != null) {
                organization.setWorkStartTime(request.setup().workStartTime());
            }
            if (request.setup().workEndTime() != null) {
                organization.setWorkEndTime(request.setup().workEndTime());
            }
        }
        return organizationRepository.save(organization);
    }

    private Employee createOwnerEmployee(Organization organization, RegisterOrganizationRequest request) {
        Employee employee = new Employee();
        employee.setOrganizationId(organization.getId());
        employee.setEmployeeNumber("EMP-001");
        employee.setFirstName(request.account().firstName().trim());
        employee.setLastName(request.account().lastName().trim());
        employee.setWorkEmail(request.account().email().trim().toLowerCase(Locale.ROOT));
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setHireDate(LocalDate.now());
        employee.setJobTitle("Organization Administrator");
        return employeeRepository.save(employee);
    }

    private UserAccount createOwnerUser(
            Organization organization,
            Employee employee,
            RegisterOrganizationRequest request,
            String email
    ) {
        Role orgAdmin = roleRepository.findByCode(ORG_ADMIN_ROLE)
                .orElseThrow(() -> new IllegalStateException("ORG_ADMIN role is not configured"));

        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.account().password()));
        user.setEnabled(false);
        user.setEmailVerified(false);
        user.setEmployeeId(employee.getId());
        user.setOrganizationId(organization.getId());
        Set<Role> roles = new HashSet<>();
        roles.add(orgAdmin);
        user.setRoles(roles);
        return userAccountRepository.save(user);
    }

    private void createMembership(UserAccount user, Organization organization) {
        OrganizationMembership membership = new OrganizationMembership();
        membership.setUserId(user.getId());
        membership.setOrganizationId(organization.getId());
        membership.setRoleCode(ORG_ADMIN_ROLE);
        membership.setStatus(MembershipStatus.ACTIVE);
        membership.setPrimary(true);
        membershipRepository.save(membership);
    }

    private void applyOptionalSetup(Organization organization, RegisterOrganizationRequest.SetupPayload setup) {
        if (setup == null) {
            return;
        }
        List<String> departments = setup.departments();
        if (departments != null) {
            int index = 1;
            for (String name : departments) {
                if (name == null || name.isBlank()) {
                    continue;
                }
                Department department = new Department();
                department.setOrganizationId(organization.getId());
                department.setName(name.trim());
                department.setCode("DEPT-" + String.format("%02d", index++));
                departmentRepository.save(department);
            }
        }
        List<String> locations = setup.locations();
        if (locations != null) {
            for (String name : locations) {
                if (name == null || name.isBlank()) {
                    continue;
                }
                Location location = new Location();
                location.setOrganizationId(organization.getId());
                location.setName(name.trim());
                location.setCountry(organization.getCountry());
                location.setTimezone(organization.getTimezone());
                locationRepository.save(location);
            }
        }
    }

    private String uniqueSlug(String name) {
        String base = slugifySafe(name);
        String candidate = base;
        int suffix = 2;
        while (organizationRepository.existsBySlugIgnoreCase(candidate)) {
            candidate = base + "-" + suffix;
            suffix++;
            if (suffix > 10_000) {
                throw new BusinessException("Unable to allocate a unique organization slug");
            }
        }
        return candidate;
    }

    private static String slugifySafe(String name) {
        return SlugUtils.slugify(name);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String defaultCurrencyForCountry(String country) {
        if (country == null) {
            return "USD";
        }
        return switch (country.trim().toUpperCase(Locale.ROOT)) {
            case "GB", "UK", "UNITED KINGDOM" -> "GBP";
            case "DE", "FR", "ES", "IT", "NL", "BE", "AT", "IE", "PT", "FI", "EUROPE", "EU" -> "EUR";
            case "CA", "CANADA" -> "CAD";
            case "AU", "AUSTRALIA" -> "AUD";
            case "JP", "JAPAN" -> "JPY";
            case "IN", "INDIA" -> "INR";
            case "BA", "BOSNIA", "BOSNIA AND HERZEGOVINA" -> "BAM";
            default -> "USD";
        };
    }
}
