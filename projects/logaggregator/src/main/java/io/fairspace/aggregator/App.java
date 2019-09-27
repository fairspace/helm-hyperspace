package io.fairspace.aggregator;

public class App {
    private static final Config config = Config.load();
    private static final EventLogger eventLogger = new Slf4jEventLogger();
    private static final EventListener eventListener = new EventListener(config.rabbitmq, eventLogger);

    public static void main(String[] args) {
        // I don't do anything, just watch what others do ;-)
    }
}
