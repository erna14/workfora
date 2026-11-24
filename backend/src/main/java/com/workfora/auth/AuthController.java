package com.workfora.auth;

import com.workfora.auth.dto.LoginRequest;
import com.workfora.auth.dto.LoginResponse;
import com.workfora.auth.dto.RegisterOrganizationRequest;
import com.workfora.auth.dto.RegistrationResponse;
import com.workfora.auth.dto.ResendVerificationRequest;
import com.workfora.auth.dto.UserMeResponse;
import com.workfora.auth.dto.VerifyEmailRequest;
import com.workfora.auth.dto.VerifyEmailResponse;
import com.workfora.common.response.ApiResponse;
import com.workfora.config.WorkforaProperties;
import com.workfora.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final OrganizationRegistrationService registrationService;
    private final EmailVerificationService emailVerificationService;
    private final WorkforaProperties properties;

    public AuthController(
            AuthService authService,
            OrganizationRegistrationService registrationService,
            EmailVerificationService emailVerificationService,
            WorkforaProperties properties
    ) {
        this.authService = authService;
        this.registrationService = registrationService;
        this.emailVerificationService = emailVerificationService;
        this.properties = properties;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.rawRefreshToken(), result.refreshMaxAgeSeconds()).toString())
                .body(ApiResponse.of(result.response()));
    }

    @PostMapping("/register/organization")
    public ApiResponse<RegistrationResponse> registerOrganization(
            @Valid @RequestBody RegisterOrganizationRequest request,
            HttpServletRequest httpRequest
    ) {
        String clientKey = httpRequest.getRemoteAddr();
        return ApiResponse.of(registrationService.register(request, clientKey));
    }

    @PostMapping("/verify-email")
    public ApiResponse<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ApiResponse.of(emailVerificationService.verify(request));
    }

    @PostMapping("/resend-verification")
    public ApiResponse<Map<String, String>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        String rawToken = emailVerificationService.resend(request);
        if (properties.getRegistration().isExposeVerificationToken() && rawToken != null) {
            return ApiResponse.of(Map.of(
                    "message", "If an unverified account exists for this email, a verification message has been sent.",
                    "developmentVerificationToken", rawToken
            ));
        }
        return ApiResponse.of(Map.of(
                "message", "If an unverified account exists for this email, a verification message has been sent."
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @CookieValue(name = AuthService.REFRESH_COOKIE, required = false) String refreshToken
    ) {
        AuthService.AuthResult result = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.rawRefreshToken(), result.refreshMaxAgeSeconds()).toString())
                .body(ApiResponse.of(result.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = AuthService.REFRESH_COOKIE, required = false) String refreshToken
    ) {
        authService.logout(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .body(ApiResponse.of(null));
    }

    @GetMapping("/me")
    public ApiResponse<UserMeResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.of(authService.me(principal));
    }

    private ResponseCookie refreshCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(AuthService.REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(AuthService.REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }
}
