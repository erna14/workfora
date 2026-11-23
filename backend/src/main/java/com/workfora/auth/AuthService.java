package com.workfora.auth;

import com.workfora.auth.dto.LoginRequest;
import com.workfora.auth.dto.LoginResponse;
import com.workfora.auth.dto.UserMeResponse;
import com.workfora.common.exception.BusinessException;
import com.workfora.identity.domain.Permission;
import com.workfora.identity.domain.RefreshToken;
import com.workfora.identity.domain.Role;
import com.workfora.identity.domain.UserAccount;
import com.workfora.identity.repository.RefreshTokenRepository;
import com.workfora.identity.repository.UserAccountRepository;
import com.workfora.security.JwtService;
import com.workfora.security.UserPrincipal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    public static final String REFRESH_COOKIE = "refresh_token";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserAccountRepository userAccountRepository,
            RefreshTokenRepository refreshTokenRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return issueTokens(principal);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BusinessException("Refresh token missing", HttpStatus.UNAUTHORIZED);
        }
        String hash = sha256(rawRefreshToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new BusinessException("Invalid refresh token", HttpStatus.UNAUTHORIZED));
        if (existing.getExpiresAt().isBefore(Instant.now())) {
            existing.setRevoked(true);
            throw new BusinessException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }
        existing.setRevoked(true);
        UserAccount user = existing.getUser();
        UserPrincipal principal = toPrincipal(user);
        return issueTokens(principal);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHashAndRevokedFalse(sha256(rawRefreshToken))
                .ifPresent(token -> token.setRevoked(true));
    }

    @Transactional(readOnly = true)
    public UserMeResponse me(UserPrincipal principal) {
        UserAccount user = userAccountRepository.findWithRolesById(principal.getId())
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.UNAUTHORIZED));
        return toMe(user);
    }

    private AuthResult issueTokens(UserPrincipal principal) {
        String accessToken = jwtService.generateAccessToken(principal);
        String rawRefresh = generateRawToken();
        UserAccount user = userAccountRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException("User not found", HttpStatus.UNAUTHORIZED));
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(sha256(rawRefresh));
        refreshToken.setExpiresAt(Instant.now().plusSeconds(jwtService.getRefreshTokenExpiresInSeconds()));
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);

        UserAccount full = userAccountRepository.findWithRolesById(principal.getId()).orElse(user);
        LoginResponse response = new LoginResponse(
                accessToken,
                jwtService.getAccessTokenExpiresInSeconds(),
                toMe(full)
        );
        return new AuthResult(response, rawRefresh, jwtService.getRefreshTokenExpiresInSeconds());
    }

    private UserPrincipal toPrincipal(UserAccount user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        for (Role role : user.getRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getCode()));
            for (Permission permission : role.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(permission.getCode()));
            }
        }
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isEnabled(),
                user.getEmployeeId(),
                authorities
        );
    }

    private UserMeResponse toMe(UserAccount user) {
        List<String> roles = user.getRoles().stream().map(Role::getCode).sorted().toList();
        List<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .distinct()
                .sorted()
                .toList();
        return new UserMeResponse(user.getId(), user.getEmail(), user.getEmployeeId(), roles, permissions);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    public static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public record AuthResult(LoginResponse response, String rawRefreshToken, long refreshMaxAgeSeconds) {
    }
}
