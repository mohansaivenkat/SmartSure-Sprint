package com.group2.api_gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteValidatorTest {

    private final RouteValidator routeValidator = new RouteValidator();

    @Test
    void testIsOpenEndpoint_OpenPath() {
        ServerHttpRequest request = MockServerHttpRequest.get("/api/auth/login").build();
        assertTrue(routeValidator.isOpenEndpoint(request));
    }

    @Test
    void testIsOpenEndpoint_SecuredPath() {
        ServerHttpRequest request = MockServerHttpRequest.get("/api/admin/users").build();
        assertFalse(routeValidator.isOpenEndpoint(request));
    }
}
