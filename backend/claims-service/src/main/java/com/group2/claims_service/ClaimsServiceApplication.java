package com.group2.claims_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.servers.Server;

import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@OpenAPIDefinition(servers = @Server(url = "/claims-service", description = "Claims Service via API Gateway"))
public class ClaimsServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClaimsServiceApplication.class, args);
	}

}
