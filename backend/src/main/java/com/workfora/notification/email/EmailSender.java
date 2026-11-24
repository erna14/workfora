package com.workfora.notification.email;

public interface EmailSender {
    void send(String to, String subject, String textBody);
}
