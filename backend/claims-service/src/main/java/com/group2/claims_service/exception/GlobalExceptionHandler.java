package com.group2.claims_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
	
	 @ExceptionHandler(ClaimNotFoundException.class)
	    public ResponseEntity<String> handleClaimNotFound(ClaimNotFoundException ex) {

	        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
	    }
	    
	    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
	    public ResponseEntity<java.util.Map<String, String>> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
	        java.util.Map<String, String> errors = new java.util.HashMap<>();
	        ex.getBindingResult().getFieldErrors().forEach(error -> 
	            errors.put(error.getField(), error.getDefaultMessage()));
	        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
	    }
	    
	    @ExceptionHandler(RuntimeException.class)
	    public ResponseEntity<java.util.Map<String, String>> handleRuntimeException(RuntimeException ex) {
	        java.util.Map<String, String> error = new java.util.HashMap<>();
	        error.put("message", ex.getMessage());
	        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
	    }
}
