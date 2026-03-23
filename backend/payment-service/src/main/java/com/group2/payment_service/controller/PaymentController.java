package com.group2.payment_service.controller;

import com.group2.payment_service.dto.PaymentRequest;
import com.group2.payment_service.dto.PaymentResponse;
import com.group2.payment_service.dto.PaymentVerifyRequest;
import com.group2.payment_service.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import io.swagger.v3.oas.annotations.Parameter;

@RestController
@RequestMapping("/payment")
@Tag(name = "Payment Management", description = "Endpoints for initiating and verifying payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create")
    @Operation(summary = "Create a Razorpay Order")
    public ResponseEntity<?> createOrder(@RequestBody PaymentRequest request) {
        try {
            PaymentResponse response = paymentService.createOrder(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify a Razorpay Payment")
    public ResponseEntity<String> verifyPayment(@RequestBody PaymentVerifyRequest request) {
        String result = paymentService.verifyPayment(request);
        if ("Payment Verification Successful".equals(result)) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
}
