package com.group2.notification_service.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.group2.notification_service.dto.NotificationEvent;

@Configuration
public class RabbitMQConfig {

    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";

    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE);
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(notificationExchange())
                .with("notification.#");
    }

    /**
     * Critical fix: map any __TypeId__ from producer services to our local NotificationEvent.
     * Without this, Jackson fails with ClassNotFoundException because the producer's
     * class path (e.g. com.group2.claims_service.dto.NotificationEvent) doesn't exist here.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();

        // Map all incoming __TypeId__ values to our local NotificationEvent
        Map<String, Class<?>> idClassMapping = new HashMap<>();
        idClassMapping.put("com.group2.claims_service.dto.NotificationEvent", NotificationEvent.class);
        idClassMapping.put("com.group2.policy_service.dto.NotificationEvent", NotificationEvent.class);
        idClassMapping.put("com.group2.notification_service.dto.NotificationEvent", NotificationEvent.class);
        typeMapper.setIdClassMapping(idClassMapping);
        // Allow trusted packages so deserialization doesn't fail on unknown headers
        typeMapper.setTrustedPackages("com.group2.*");

        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        return factory;
    }
}
