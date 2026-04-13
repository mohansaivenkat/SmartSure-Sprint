package com.group2.admin_service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group2.admin_service.exception.AdminException;
import com.group2.admin_service.exception.ErrorDetails;
import feign.Response;
import feign.codec.ErrorDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;

@Configuration
public class CustomErrorDecoder implements ErrorDecoder {

    private static final Logger log = LoggerFactory.getLogger(CustomErrorDecoder.class);
    private final ErrorDecoder defaultErrorDecoder = new Default();

    @Override
    public Exception decode(String methodKey, Response response) {
        log.error("Feign request failed. Method: {}, Status: {}", methodKey, response.status());

        try {
            if (response.body() != null) {
                try (InputStream inputStream = response.body().asInputStream()) {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.findAndRegisterModules(); 
                    ErrorDetails errorDetails = mapper.readValue(inputStream, ErrorDetails.class);
                    
                    if (errorDetails != null) {
                        log.error("Received error details from downstream: {}", errorDetails.getMessage());
                        return new AdminException(errorDetails.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to decode feign error body", e);
        }

        return defaultErrorDecoder.decode(methodKey, response);
    }
}
