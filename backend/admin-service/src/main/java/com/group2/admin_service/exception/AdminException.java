package com.group2.admin_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class AdminException extends RuntimeException {
    public AdminException(String message) {
        super(message);
    }
}
