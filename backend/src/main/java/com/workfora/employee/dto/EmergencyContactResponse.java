package com.workfora.employee.dto;

import java.util.UUID;

public record EmergencyContactResponse(UUID id, String name, String relationship, String phone, String email) {}
