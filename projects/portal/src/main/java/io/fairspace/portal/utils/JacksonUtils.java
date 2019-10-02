package io.fairspace.portal.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class JacksonUtils {
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

    /**
     * Returns a config value from the given configuration as text. If the node does not exist, the method returns null
     * @param config
     * @param yamlPath
     * @return
     */
    public static String getConfigAsText(JsonNode config, String yamlPath) {
        if(config == null) {
            return null;
        }

        JsonNode node = config.at(yamlPath);

        if(node == null) {
            return null;
        }

        return node.asText();
    }
}
