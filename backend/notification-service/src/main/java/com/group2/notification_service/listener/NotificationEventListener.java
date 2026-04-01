package com.group2.notification_service.listener;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.group2.notification_service.config.RabbitMQConfig;
import com.group2.notification_service.dto.NotificationEvent;
import com.group2.notification_service.service.INotificationService;

import lombok.extern.slf4j.Slf4j;

import org.slf4j.*;
@Component
@Slf4j
public class NotificationEventListener {

    private final INotificationService notificationService;
    
    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    public NotificationEventListener(INotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("Received RabbitMQ Notification Event for: {}, Subject: {}", event.getEmail(), event.getSubject());
        try {
            notificationService.sendGeneralEmail(event.getEmail(), event.getSubject(), event.getMessage());
            log.info("Notification email sent successfully to: {}", event.getEmail());
        } catch (Exception e) {
            log.error("Failed to process notification event for {}: {}", event.getEmail(), e.getMessage());
        }
    }
}
