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

    public EventListener(Config.RabbitMQ config, EventLogger logger) {
        try {
            var factory = new ConnectionFactory();
            factory.setHost(config.host);
            factory.setPort(config.port);
            factory.setUsername(config.username);
            factory.setPassword(config.password);
            factory.setVirtualHost(config.virtualHost);

            var connection = factory.newConnection();
            var channel = connection.createChannel();

            channel.queueDeclare(config.queueName, true, false, false, null);
            channel.queueBind(config.queueName, config.exchangeName, ROUTING_KEY_WILDCARD);

            channel.basicConsume(config.queueName,
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
