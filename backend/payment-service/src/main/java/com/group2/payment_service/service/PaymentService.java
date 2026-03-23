package com.group2.payment_service.service;

import com.group2.payment_service.dto.PaymentRequest;
import com.group2.payment_service.dto.PaymentResponse;
import com.group2.payment_service.dto.PaymentVerifyRequest;
import com.group2.payment_service.entity.Transaction;
import com.group2.payment_service.repository.TransactionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.json.JSONObject;

import java.util.Optional;

import com.group2.payment_service.repository.UserRepository;
import com.group2.payment_service.repository.PolicyRepository;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PolicyRepository policyRepository;

    public PaymentResponse createOrder(PaymentRequest request) {
        // Validate User Exists (100% Reliable Local DB Query)
        if (!userRepository.existsById(request.getUserId())) {
            throw new IllegalArgumentException("Invalid User ID: User does not exist.");
        }

        // Validate Policy Exists (100% Reliable Local DB Query)
        if (!policyRepository.existsById(request.getPolicyId())) {
            throw new IllegalArgumentException("Invalid Policy ID: Policy does not exist.");
        }

        try {
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            // Razorpay amount is in paise so multiply by 100
            orderRequest.put("amount", request.getAmount() * 100);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "receipt_" + System.currentTimeMillis());

            Order order = razorpayClient.orders.create(orderRequest);

            Transaction transaction = new Transaction();
            transaction.setRazorpayOrderId(order.get("id"));
            transaction.setUserId(request.getUserId());
            transaction.setPolicyId(request.getPolicyId());
            transaction.setAmount(request.getAmount());
            transaction.setStatus("PENDING");

            transactionRepository.save(transaction);

            return new PaymentResponse(order.get("id"), "CREATED", request.getAmount(), "Order created successfully");

        } catch (RazorpayException e) {
            e.printStackTrace();
            throw new RuntimeException("Exception while creating Razorpay order: " + e.getMessage());
        }
    }

    public String verifyPayment(PaymentVerifyRequest verifyRequest) {
        try {
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", verifyRequest.getRazorpayOrderId());
            options.put("razorpay_payment_id", verifyRequest.getRazorpayPaymentId());
            options.put("razorpay_signature", verifyRequest.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);

            Optional<Transaction> transactionOpt = transactionRepository.findByRazorpayOrderId(verifyRequest.getRazorpayOrderId());
            
            if (isValid) {
                if (transactionOpt.isPresent()) {
                    Transaction transaction = transactionOpt.get();
                    transaction.setRazorpayPaymentId(verifyRequest.getRazorpayPaymentId());
                    transaction.setRazorpaySignature(verifyRequest.getRazorpaySignature());
                    transaction.setStatus("SUCCESS");
                    transactionRepository.save(transaction);
                }
                return "Payment Verification Successful";
            } else {
                if (transactionOpt.isPresent()) {
                    Transaction transaction = transactionOpt.get();
                    transaction.setStatus("FAILED");
                    transactionRepository.save(transaction);
                }
                return "Payment Verification Failed";
            }
        } catch (RazorpayException e) {
            e.printStackTrace();
            throw new RuntimeException("Exception while verifying Razorpay payment: " + e.getMessage());
        }
    }
}
