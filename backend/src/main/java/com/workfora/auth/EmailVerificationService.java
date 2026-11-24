package com.workfora.auth;

import com.workfora.auth.dto.ResendVerificationRequest;
import com.workfora.auth.dto.VerifyEmailRequest;
import com.workfora.auth.dto.VerifyEmailResponse;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.ratelimit.InMemoryRateLimiter;
import com.workfora.config.WorkforaProperties;
import com.workfora.identity.domain.EmailVerificationToken;
import com.workfora.identity.domain.UserAccount;
import com.workfora.identity.repository.EmailVerificationTokenRepository;
import com.workfora.identity.repository.UserAccountRepository;
import com.workfora.notification.email.EmailSender;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmailSender emailSender;
    private final WorkforaProperties properties;
    private final InMemoryRateLimiter rateLimiter;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
            EmailVerificationTokenRepository tokenRepository,
            UserAccountRepository userAccountRepository,
            EmailSender emailSender,
            WorkforaProperties properties,
            InMemoryRateLimiter rateLimiter
    ) {
        this.tokenRepository = tokenRepository;
        this.userAccountRepository = userAccountRepository;
        this.emailSender = emailSender;
        this.properties = properties;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public String issueToken(UserAccount user) {
        tokenRepository.invalidateUnusedForUser(user.getId(), Instant.now());
        String rawToken = generateRawToken();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(AuthService.sha256(rawToken));
        token.setExpiresAt(Instant.now().plusSeconds(properties.getRegistration().getVerificationTokenHours() * 3600L));
        tokenRepository.save(token);
        return rawToken;
    }

    public void sendVerificationEmailAfterCommit(UserAccount user, String rawToken) {
        String email = user.getEmail();
        Runnable send = () -> sendVerificationEmail(email, rawToken);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send.run();
                }
            });
        } else {
            send.run();
        }
    }

    private void sendVerificationEmail(String email, String rawToken) {
        String verifyUrl = properties.getRegistration().getFrontendBaseUrl()
                + "/verify-email?token=" + rawToken;
        String body = """
                Welcome to Workfora.

                Please verify your email address to activate your organization workspace:
                %s

                This link expires in %d hours. If you did not create this account, you can ignore this message.
                """.formatted(verifyUrl, properties.getRegistration().getVerificationTokenHours());
        emailSender.send(email, "Verify your Workfora account", body);
    }

    @Transactional
    public VerifyEmailResponse verify(VerifyEmailRequest request) {
        if (!rateLimiter.tryAcquire("verify:" + request.token().hashCode(), 20, 3600)) {
            throw new BusinessException("Too many verification attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
        }
        EmailVerificationToken token = tokenRepository.findByTokenHash(AuthService.sha256(request.token()))
                .orElseThrow(() -> new BusinessException("Invalid or expired verification link", HttpStatus.BAD_REQUEST));
        if (token.isUsed()) {
            throw new BusinessException("This verification link has already been used", HttpStatus.BAD_REQUEST);
        }
        if (token.isExpired()) {
            throw new BusinessException("This verification link has expired", HttpStatus.BAD_REQUEST);
        }
        UserAccount user = token.getUser();
        user.setEmailVerified(true);
        user.setEnabled(true);
        Instant now = Instant.now();
        token.setUsedAt(now);
        tokenRepository.invalidateUnusedForUser(user.getId(), now);
        return new VerifyEmailResponse(true, user.getEmail(), "Email verified successfully. You can now sign in.");
    }

    @Transactional
    public String resend(ResendVerificationRequest request) {
        String email = request.email().trim().toLowerCase();
        if (!rateLimiter.tryAcquire("resend:" + email, 5, 3600)) {
            throw new BusinessException("Too many resend attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
        }
        // Always return a generic message; never reveal whether the email exists.
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email).orElse(null);
        String rawToken = null;
        if (user != null && !user.isEmailVerified()) {
            rawToken = issueToken(user);
            sendVerificationEmailAfterCommit(user, rawToken);
        }
        return rawToken;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
