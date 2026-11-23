package com.workfora.common.response;

public record PageMeta(
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
