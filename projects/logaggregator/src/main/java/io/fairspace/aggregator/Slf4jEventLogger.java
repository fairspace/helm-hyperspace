package io.fairspace.aggregator;

import io.fairspace.aggregator.model.EventContainer;
import lombok.extern.slf4j.Slf4j;

import java.util.Date;

@Slf4j
public class Slf4jEventLogger implements EventLogger {
    @Override
    public void log(Date timestamp, EventContainer eventContainer, String payload) {
        log.info("timestamp: {}, workspace: {}, user id: {}, user name: {}, payload: {}",
                timestamp,
                eventContainer.getWorkspace(),
                eventContainer.getUser().getId(),
                eventContainer.getUser().getName(),
                payload);
    }
}
