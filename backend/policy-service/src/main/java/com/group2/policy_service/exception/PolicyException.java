package com.group2.policy_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class PolicyException extends RuntimeException {
    public PolicyException(String message) {
        super(message);
    }
}
