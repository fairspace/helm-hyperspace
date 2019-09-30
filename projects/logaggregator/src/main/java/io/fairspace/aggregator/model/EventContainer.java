package io.fairspace.aggregator.model;

import lombok.Data;

@Data
public class EventContainer {
    String workspace;
    User user;
    Event event;
}
