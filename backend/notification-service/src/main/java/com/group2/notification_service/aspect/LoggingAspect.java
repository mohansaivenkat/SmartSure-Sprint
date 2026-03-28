package com.group2.notification_service.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

@Aspect
@Component
public class LoggingAspect {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Around("execution(* com.group2.notification_service.controller.*.*(..)) || execution(* com.group2.notification_service.service..*.*(..))")
    public Object profile(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        String className = proceedingJoinPoint.getSignature().getDeclaringTypeName();
        String methodName = proceedingJoinPoint.getSignature().getName();
        
        logger.info("Entering {}.{}()", className, methodName);
        
        Object result;
        try {
            result = proceedingJoinPoint.proceed();
        } catch (Throwable throwable) {
            logger.error("Exception in {}.{}() - {}", className, methodName, throwable.getMessage());
            throw throwable;
        }
        
        stopWatch.stop();
        logger.info("Exiting {}.{}() - execution time: {} ms", className, methodName, stopWatch.getTotalTimeMillis());
        
        return result;
    }
}
