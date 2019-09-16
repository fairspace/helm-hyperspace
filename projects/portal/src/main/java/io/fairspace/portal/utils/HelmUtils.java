package io.fairspace.portal.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import hapi.release.ReleaseOuterClass;

import java.io.IOException;

import static java.lang.Integer.parseInt;
import static java.util.Optional.ofNullable;

public class HelmUtils {
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());
    public static final String GIGABYTE_SUFFIX = "Gi";
    public static final String WORKSPACE_CHART = "workspace";
    public static final String JUPYTER_CHART = "jupyter";

    public static int getSize(String value) {
        return ofNullable(value)
                .filter(str -> !str.isEmpty())
                .map(str -> parseInt(str.replace(GIGABYTE_SUFFIX, "")))
                .orElse(-1);
    }

    /**
     * Returns the configuration for the given release
     * @param release
     * @return
     * @throws IOException
     */
    public static JsonNode getReleaseConfig(ReleaseOuterClass.Release release) throws IOException {
        return objectMapper.readTree(release.getConfig().getRaw());
    }
}
