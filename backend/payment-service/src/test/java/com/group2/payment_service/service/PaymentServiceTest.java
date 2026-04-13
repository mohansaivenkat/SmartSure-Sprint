package com.group2.payment_service.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.json.JSONObject;

import com.group2.payment_service.dto.PaymentRequest;
import com.group2.payment_service.dto.PaymentResponse;
import com.group2.payment_service.dto.PaymentVerifyRequest;
import com.group2.payment_service.entity.Transaction;
import com.group2.payment_service.repository.PolicyRepository;
import com.group2.payment_service.repository.TransactionRepository;
import com.group2.payment_service.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.razorpay.OrderClient;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private UserRepository userRepository;
    @Mock private PolicyRepository policyRepository;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "razorpayKeyId", "test_id");
        ReflectionTestUtils.setField(paymentService, "razorpayKeySecret", "test_secret");
    }

    @Test
    void testCreateOrder_ValidationErrors() {
        PaymentRequest req = new PaymentRequest();
        assertThrows(IllegalArgumentException.class, () -> paymentService.createOrder(req));
        
        req.setUserId(1L);
        assertThrows(IllegalArgumentException.class, () -> paymentService.createOrder(req));
        
        req.setPolicyId(10L);
        req.setAmount(null);
        assertThrows(IllegalArgumentException.class, () -> paymentService.createOrder(req));

        req.setAmount(-10.0);
        assertThrows(IllegalArgumentException.class, () -> paymentService.createOrder(req));
    }

    @Test
    void testCreateOrder_Success() throws RazorpayException {
        PaymentRequest req = new PaymentRequest(1L, 10L, 500.0);
        when(userRepository.existsById(1L)).thenReturn(true); 
        when(policyRepository.existsById(10L)).thenReturn(true);

        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class, (mock, context) -> {
            OrderClient orderClient = mock(OrderClient.class);
            ReflectionTestUtils.setField(mock, "orders", orderClient);
            Order order = mock(Order.class);
            when(order.get("id")).thenReturn("order_123");
            when(orderClient.create(any(JSONObject.class))).thenReturn(order);
        })) {
            PaymentResponse res = paymentService.createOrder(req);
            assertEquals("order_123", res.getOrderId());
        }
    }

    @Test
    void testCreateOrder_UserNotFound() throws RazorpayException {
        PaymentRequest req = new PaymentRequest(1L, 10L, 500.0);
        when(userRepository.existsById(1L)).thenReturn(false);
        when(policyRepository.existsById(10L)).thenReturn(false);
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class, (mock, context) -> {
            OrderClient orderClient = mock(OrderClient.class);
            ReflectionTestUtils.setField(mock, "orders", orderClient);
            Order order = mock(Order.class);
            when(order.get("id")).thenReturn("o");
            when(orderClient.create(any())).thenReturn(order);
        })) {
            paymentService.createOrder(req);
        }
    }

    @Test
    void testCreateOrder_RazorpayException() throws RazorpayException {
        PaymentRequest req = new PaymentRequest(1L, 10L, 500.0);
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class, (mock, context) -> {
            OrderClient orderClient = mock(OrderClient.class);
            ReflectionTestUtils.setField(mock, "orders", orderClient);
            when(orderClient.create(any(JSONObject.class))).thenThrow(new RazorpayException("Error"));
        })) {
            assertThrows(RuntimeException.class, () -> paymentService.createOrder(req));
        }
    }

    @Test
    void testVerifyPayment_Success() {
        PaymentVerifyRequest req = new PaymentVerifyRequest("o", "p", "s");
        Transaction transaction = new Transaction();
        when(transactionRepository.findByRazorpayOrderId("o")).thenReturn(Optional.of(transaction));
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class);
             MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), anyString())).thenReturn(true);
            assertEquals("Payment Verification Successful", paymentService.verifyPayment(req));
        }
    }

    @Test
    void testVerifyPayment_Failure() {
        PaymentVerifyRequest req = new PaymentVerifyRequest("o", "p", "s");
        Transaction transaction = new Transaction();
        when(transactionRepository.findByRazorpayOrderId("o")).thenReturn(Optional.of(transaction));
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class);
             MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), anyString())).thenReturn(false);
            assertEquals("Payment Verification Failed", paymentService.verifyPayment(req));
        }
    }

    @Test
    void testVerifyPayment_Exception() {
        PaymentVerifyRequest req = new PaymentVerifyRequest();
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class, (mock, context) -> {
             throw new RazorpayException("Constructor Fail");
        })) {
             assertThrows(RuntimeException.class, () -> paymentService.verifyPayment(req));
        }
    }

    @Test
    void testVerifyPayment_StaticException() {
        PaymentVerifyRequest req = new PaymentVerifyRequest();
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class);
             MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
             mockedUtils.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), anyString())).thenThrow(new RazorpayException("Static Fail"));
             assertThrows(RuntimeException.class, () -> paymentService.verifyPayment(req));
        }
    }
    
    @Test
    void testVerifyPayment_Failure_TransactionNotFound() {
        PaymentVerifyRequest req = new PaymentVerifyRequest("o", "p", "s");
        when(transactionRepository.findByRazorpayOrderId("o")).thenReturn(Optional.empty());
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class);
             MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), anyString())).thenReturn(false);
            assertEquals("Payment Verification Failed", paymentService.verifyPayment(req));
        }
    }

    @Test
    void testVerifyPayment_Success_TransactionNotFound() {
        PaymentVerifyRequest req = new PaymentVerifyRequest("o", "p", "s");
        when(transactionRepository.findByRazorpayOrderId("o")).thenReturn(Optional.empty());
        try (MockedConstruction<RazorpayClient> mockedClient = mockConstruction(RazorpayClient.class);
             MockedStatic<Utils> mockedUtils = mockStatic(Utils.class)) {
            mockedUtils.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), anyString())).thenReturn(true);
            assertEquals("Payment Verification Successful", paymentService.verifyPayment(req));
        }
    }
}
