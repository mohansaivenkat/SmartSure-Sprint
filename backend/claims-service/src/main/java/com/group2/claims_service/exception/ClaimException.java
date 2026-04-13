package com.group2.claims_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class ClaimException extends RuntimeException {
    public ClaimException(String message) {
        super(message);
    }
}
