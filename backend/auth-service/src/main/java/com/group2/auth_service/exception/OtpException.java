package com.group2.auth_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class OtpException extends RuntimeException {
    public OtpException(String message) {
        super(message);
    }
}
