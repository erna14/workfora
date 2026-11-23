package com.workfora.auth;

import com.workfora.identity.domain.UserAccount;
import com.workfora.identity.repository.UserAccountRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
public class LocalPasswordSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LocalPasswordSeeder.class);
    private static final String LOCAL_PASSWORD = "Admin123!";

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public LocalPasswordSeeder(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String hash = passwordEncoder.encode(LOCAL_PASSWORD);
        List<UserAccount> users = userAccountRepository.findAll();
        for (UserAccount user : users) {
            user.setPasswordHash(hash);
        }
        userAccountRepository.saveAll(users);
        log.info("Local password seeder updated {} user(s) to password Admin123!", users.size());
    }
}
