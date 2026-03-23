package com.group2.admin_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "claim.exchange";

    public static final String CLAIM_CREATED_QUEUE = "claim.created.queue";
    public static final String CLAIM_REVIEW_QUEUE = "claim.review.queue";

    public static final String CLAIM_CREATED_ROUTING_KEY = "claim.created";
    public static final String CLAIM_REVIEW_ROUTING_KEY = "claim.review";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue claimCreatedQueue() {
        return new Queue(CLAIM_CREATED_QUEUE, true);
    }

    @Bean
    public Queue claimReviewQueue() {
        return new Queue(CLAIM_REVIEW_QUEUE, true);
    }

    @Bean
    public Binding claimCreatedBinding() {
        return BindingBuilder
                .bind(claimCreatedQueue())
                .to(exchange())
                .with(CLAIM_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding claimReviewBinding() {
        return BindingBuilder
                .bind(claimReviewQueue())
                .to(exchange())
                .with(CLAIM_REVIEW_ROUTING_KEY);
    }
    
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
