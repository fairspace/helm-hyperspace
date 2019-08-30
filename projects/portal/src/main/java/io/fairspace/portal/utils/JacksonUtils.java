package io.fairspace.portal.utils;

import com.fasterxml.jackson.databind.node.ObjectNode;

public class JacksonUtils {
    /**
     * Merges two ObjectNode objects, applying changes to the left object.
     * Adds to the left object all values from right which are missing in the left.
     * Replaces all values which present on both sides and at least one value is not an object with values from the right.
     * If values on both sides are objects, recursively merges them.
     * No special logic for arrays.
     *
     * @param left
     * @param right
     * @return the left object
     */
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
