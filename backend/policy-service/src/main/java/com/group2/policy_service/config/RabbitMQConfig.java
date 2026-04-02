package com.group2.policy_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String CANCELLATION_QUEUE = "policy.cancellation.queue";
    public static final String POLICY_EXCHANGE = "policy.exchange";
    public static final String CANCELLATION_ROUTING_KEY = "policy.cancellation";
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";

    @Bean
    public Queue cancellationQueue() {
        return new Queue(CANCELLATION_QUEUE);
    }

    @Bean
    public DirectExchange policyExchange() {
        return new DirectExchange(POLICY_EXCHANGE);
    }

    @Bean
    public Binding binding(Queue cancellationQueue, DirectExchange policyExchange) {
        return BindingBuilder.bind(cancellationQueue).to(policyExchange).with(CANCELLATION_ROUTING_KEY);
    }

    @Bean
    public org.springframework.amqp.core.TopicExchange notificationExchange() {
        return new org.springframework.amqp.core.TopicExchange(NOTIFICATION_EXCHANGE);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
