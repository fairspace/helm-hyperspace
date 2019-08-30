package io.fairspace.portal.utils;

import com.fasterxml.jackson.databind.node.ObjectNode;

public class JacksonUtils {
    public static ObjectNode merge(ObjectNode left, ObjectNode right) {
        for (var it = right.fields(); it.hasNext(); ) {
            var entry = it.next();

            if (entry.getValue().isObject() && left.path(entry.getKey()).isObject()) {
                left.replace(entry.getKey(), merge((ObjectNode)left.path(entry.getKey()), (ObjectNode)entry.getValue()));
            } else {
                left.replace(entry.getKey(), entry.getValue().deepCopy());
            }
        }

        return left;
    }
}
