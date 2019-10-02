package io.fairspace.portal.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public class JacksonUtils {
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());

    public static ObjectNode createObjectNode() {
        return objectMapper.createObjectNode();
    }

    public static String toYaml(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    public static <T extends JsonNode> T valueToTree(Object fromValue) {
        return objectMapper.valueToTree(fromValue);
    }

    /**
     * Merges two ObjectNode objects and returns a new ObjectNode instance
     *
     * @param left
     * @param right
     * @return the left object
     */
    public static ObjectNode merge(ObjectNode left, ObjectNode right) {
        var result = left.deepCopy();
        for (var it = right.fields(); it.hasNext(); ) {
            var entry = it.next();

            if (entry.getValue().isObject() && left.path(entry.getKey()).isObject()) {
                result.replace(entry.getKey(), merge((ObjectNode)left.path(entry.getKey()), (ObjectNode)entry.getValue()));
            } else {
                result.replace(entry.getKey(), entry.getValue().deepCopy());
            }
        }

        return result;
    }
}
