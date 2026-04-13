package com.group2.api_gateway.filter;

import com.group2.api_gateway.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock private JwtUtil jwtUtil;
    @Mock private RouteValidator routeValidator;
    @Mock private GatewayFilterChain chain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @Test
    void testFilter_OpenEndpoint() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/auth/login").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        when(routeValidator.isOpenEndpoint(any())).thenReturn(true);
        when(chain.filter(exchange)).thenReturn(Mono.empty());
        filter.filter(exchange, chain).block();
        verify(chain).filter(exchange);
    }

    @Test
    void testFilter_MissingAuthorizationHeader() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/admin/users").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        when(routeValidator.isOpenEndpoint(any())).thenReturn(false);
        filter.filter(exchange, chain).block();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testFilter_InvalidAuthorizationHeader() {
        // Null branch exercise: although getFirst usually returns null if not present, but containsKey check is before it.
        // We can force getFirst to return null by having the key but no value in some mock setups, 
        // or just pass a value that doesn't start with Bearer.
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/admin/users")
                .header(HttpHeaders.AUTHORIZATION, "InvalidTokenFormat")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        when(routeValidator.isOpenEndpoint(any())).thenReturn(false);
        filter.filter(exchange, chain).block();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testFilter_ValidToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/admin/users")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid.jwt.token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        when(routeValidator.isOpenEndpoint(any())).thenReturn(false);
        when(jwtUtil.extractUserId(anyString())).thenReturn("1");
        when(jwtUtil.extractRole(anyString())).thenReturn("ROLE_USER");
        when(jwtUtil.extractEmail(anyString())).thenReturn("t@t.com");
        when(chain.filter(any())).thenReturn(Mono.empty());
        filter.filter(exchange, chain).block();
        verify(chain).filter(any());
    }

    @Test
    void testFilter_ExceptionDuringValidation() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/admin/users")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.jwt.token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);
        when(routeValidator.isOpenEndpoint(any())).thenReturn(false);
        doThrow(new RuntimeException("err")).when(jwtUtil).validateToken(anyString());
        filter.filter(exchange, chain).block();
        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testGetOrder() {
        assertEquals(-1, filter.getOrder());
    }
}
