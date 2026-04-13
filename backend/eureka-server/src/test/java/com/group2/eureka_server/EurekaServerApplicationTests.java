package com.group2.eureka_server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.mockito.MockedStatic;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class EurekaServerApplicationTests {

	@Test
	void testApplicationConstructor() {
		EurekaServerApplication app = new EurekaServerApplication();
		assertNotNull(app);
	}

	@Test
	void testMain() {
		try (MockedStatic<SpringApplication> springApplication = mockStatic(SpringApplication.class)) {
			springApplication.when(() -> SpringApplication.run(eq(EurekaServerApplication.class), any(String[].class)))
					.thenReturn(null);
			
			EurekaServerApplication.main(new String[]{});
			
			springApplication.verify(() -> SpringApplication.run(eq(EurekaServerApplication.class), any(String[].class)));
		}
	}

}
