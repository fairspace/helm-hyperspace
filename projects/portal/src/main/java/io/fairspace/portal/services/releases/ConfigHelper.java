package io.fairspace.portal.services.releases;

import com.fasterxml.jackson.databind.node.ObjectNode;
import hapi.chart.ConfigOuterClass;

import static io.fairspace.portal.utils.JacksonUtils.toYaml;

public class ConfigHelper {
    public static ConfigOuterClass.Config toConfig(ObjectNode values) {
        return ConfigOuterClass.Config.newBuilder().setRaw(toYaml(values)).build();
    }
}
