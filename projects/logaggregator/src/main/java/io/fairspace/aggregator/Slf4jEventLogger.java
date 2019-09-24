package io.fairspace.aggregator;

import io.fairspace.aggregator.model.EventContainer;
import org.apache.log4j.PropertyConfigurator;

import java.util.Date;

import static java.lang.String.format;
import static org.slf4j.LoggerFactory.getLogger;

public class Slf4jEventLogger implements EventLogger {
//    Slf4jEventLogger() {
//        PropertyConfigurator.configure("log4j.properties");
//    }

    @Override
    public void log(Date timestamp, EventContainer eventContainer, String payload) {
        var log = getLogger(format("audit.%s.%s.%s", eventContainer.getEvent().getCategory(), eventContainer.getEvent().getEventType(), eventContainer.getWorkspace()));
        getLogger(getClass()).error("ERRRRRROR");
        log.info("timestamp: {}, workspace: {}, user id: {}, user name: {}, payload: {}",
                timestamp,
                eventContainer.getWorkspace(),
                eventContainer.getUser().getId(),
                eventContainer.getUser().getName(),
                payload);
    }
}
