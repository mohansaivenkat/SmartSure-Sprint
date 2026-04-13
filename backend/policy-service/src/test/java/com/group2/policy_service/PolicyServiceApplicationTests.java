package com.group2.policy_service;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Disabled because database is not available during unit testing phase")
class PolicyServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
