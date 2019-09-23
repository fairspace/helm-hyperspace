package io.fairspace.aggregator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DefaultConsumer;
import com.rabbitmq.client.Envelope;
import io.fairspace.aggregator.model.EventContainer;

import java.io.IOException;
import java.util.Optional;
import java.util.concurrent.TimeoutException;

import static com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES;
import static java.nio.charset.StandardCharsets.UTF_8;

public class EventListener {
    private static final ObjectMapper mapper = new ObjectMapper()
            .configure(FAIL_ON_UNKNOWN_PROPERTIES, false);
    private static final String ROUTING_KEY_WILDCARD = "*.*.*";

    public EventListener(Config.RabbitMQ rabbitMQConfig, EventLogger logger) {
        try {
            var factory = new ConnectionFactory();
            factory.setHost(rabbitMQConfig.host);
            factory.setPort(rabbitMQConfig.port);
            factory.setUsername(rabbitMQConfig.username);
            factory.setPassword(rabbitMQConfig.password);
            factory.setVirtualHost(rabbitMQConfig.virtualHost);

            var connection = factory.newConnection();
            var channel = connection.createChannel();

            channel.queueDeclare(rabbitMQConfig.queueName, true, false, false, null);
            channel.queueBind(rabbitMQConfig.queueName, rabbitMQConfig.exchangeName, ROUTING_KEY_WILDCARD);

            channel.basicConsume(rabbitMQConfig.queueName,
                    new DefaultConsumer(channel) {
                        @Override
                        public void handleDelivery(String consumerTag,
                                                   Envelope envelope,
                                                   AMQP.BasicProperties properties,
                                                   byte[] body)
                                throws IOException {
                            var encoding = Optional.ofNullable(properties.getContentEncoding()).orElse(UTF_8.displayName());
                            var payload = new String(body, encoding);
                            var eventContainer = mapper.readValue(payload, EventContainer.class);

                            logger.log(properties.getTimestamp(), eventContainer, payload);
                        }
                    });
        } catch ( IOException | TimeoutException e) {
            throw new RuntimeException(e);
        }
    }
}
