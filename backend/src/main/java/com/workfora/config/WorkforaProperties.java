package com.workfora.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "workfora")
public class WorkforaProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Storage storage = new Storage();
    private final Registration registration = new Registration();
    private final Mail mail = new Mail();

    public Jwt getJwt() {
        return jwt;
    }

    public Cors getCors() {
        return cors;
    }

    public Storage getStorage() {
        return storage;
    }

    public Registration getRegistration() {
        return registration;
    }

    public Mail getMail() {
        return mail;
    }

    public static class Jwt {
        private String secret;
        private long accessTokenMinutes = 15;
        private long refreshTokenDays = 7;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getAccessTokenMinutes() {
            return accessTokenMinutes;
        }

        public void setAccessTokenMinutes(long accessTokenMinutes) {
            this.accessTokenMinutes = accessTokenMinutes;
        }

        public long getRefreshTokenDays() {
            return refreshTokenDays;
        }

        public void setRefreshTokenDays(long refreshTokenDays) {
            this.refreshTokenDays = refreshTokenDays;
        }
    }

    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class Storage {
        private String documentsPath = "./data/documents";

        public String getDocumentsPath() {
            return documentsPath;
        }

        public void setDocumentsPath(String documentsPath) {
            this.documentsPath = documentsPath;
        }
    }

    public static class Registration {
        private String frontendBaseUrl = "http://localhost:5173";
        private int verificationTokenHours = 24;
        private boolean exposeVerificationToken = false;

        public String getFrontendBaseUrl() {
            return frontendBaseUrl;
        }

        public void setFrontendBaseUrl(String frontendBaseUrl) {
            this.frontendBaseUrl = frontendBaseUrl;
        }

        public int getVerificationTokenHours() {
            return verificationTokenHours;
        }

        public void setVerificationTokenHours(int verificationTokenHours) {
            this.verificationTokenHours = verificationTokenHours;
        }

        public boolean isExposeVerificationToken() {
            return exposeVerificationToken;
        }

        public void setExposeVerificationToken(boolean exposeVerificationToken) {
            this.exposeVerificationToken = exposeVerificationToken;
        }
    }

    public static class Mail {
        private String from = "noreply@workfora.local";

        public String getFrom() {
            return from;
        }

        public void setFrom(String from) {
            this.from = from;
        }
    }
}
