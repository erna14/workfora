package com.workfora.auth.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;
import java.util.List;

public record RegisterOrganizationRequest(
        @NotNull @Valid AccountPayload account,
        @NotNull @Valid OrganizationPayload organization,
        @Valid SetupPayload setup
) {
    public record AccountPayload(
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank
            @Size(min = 8, max = 100)
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "Password must include upper, lower, digit and special character"
            )
            String password,
            @NotBlank String confirmPassword,
            @AssertTrue(message = "You must accept the Terms of Service and Privacy Policy")
            boolean acceptTerms
    ) {
        @AssertTrue(message = "Passwords do not match")
        public boolean isPasswordConfirmed() {
            return password != null && password.equals(confirmPassword);
        }
    }

    public record OrganizationPayload(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Email @Size(max = 255) String companyEmail,
            @NotBlank @Size(max = 100) String industry,
            @NotBlank @Size(max = 50) String companySize,
            @NotBlank @Size(max = 100) String country,
            @NotBlank @Size(max = 64) String timezone,
            @Size(max = 255) String website,
            @Size(max = 50) String phone
    ) {
    }

    public record SetupPayload(
            List<@Size(max = 150) String> departments,
            List<@Size(max = 150) String> locations,
            List<@Size(max = 10) String> workingDays,
            LocalTime workStartTime,
            LocalTime workEndTime
    ) {
    }
}
