package io.fairspace.aggregator;

import io.fairspace.aggregator.model.EventContainer;

import java.util.Date;

public interface EventLogger {
    void log(Date timestamp, EventContainer eventContainer, String payload);
}
