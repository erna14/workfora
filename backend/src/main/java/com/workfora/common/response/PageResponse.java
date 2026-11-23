package com.workfora.common.response;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(List<T> data, PageMeta meta) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                new PageMeta(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages())
        );
    }

    public static <T> PageResponse<T> of(List<T> data, PageMeta meta) {
        return new PageResponse<>(data, meta);
    }
}
