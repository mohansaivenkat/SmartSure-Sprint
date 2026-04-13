package com.group2.config_server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.mockito.MockedStatic;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class ConfigServerApplicationTests {

	@Test
	void testApplicationConstructor() {
		ConfigServerApplication app = new ConfigServerApplication();
		assertNotNull(app);
	}

	@Test
	void testMain() {
		try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
			springApplication.when(() -> SpringApplication.run(eq(ConfigServerApplication.class), any(String[].class)))
					.thenReturn(null);
			
			ConfigServerApplication.main(new String[]{});
			
			springApplication.verify(() -> SpringApplication.run(eq(ConfigServerApplication.class), any(String[].class)));
		}
	}

}
