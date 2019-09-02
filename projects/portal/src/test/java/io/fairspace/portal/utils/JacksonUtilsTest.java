package io.fairspace.portal.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.Test;

import java.io.IOException;

import static io.fairspace.portal.utils.JacksonUtils.merge;
import static org.junit.Assert.*;

public class JacksonUtilsTest {
    private static final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  public void worksWhenLeftIsEmpty() throws IOException {
      test("{\"a\": {\"b\": 1}}", "{}", "{\"a\": {\"b\": 1}}");
  }

    @Test
    public void worksWhenRightIsEmpty() throws IOException {
        test("{\"a\": {\"b\": 1}}", "{\"a\": {\"b\": 1}}", "{}");
    }

    @Test
    public void rightOverwritesScalarValues() throws IOException {
        test("{\"a\": {\"b\": 2}}", "{\"a\": {\"b\": 1}}", "{\"a\": {\"b\": 2}}");
    }

    @Test
    public void rightOverwritesArrayValues() throws IOException {
        test("{\"a\": {\"b\": [2]}}", "{\"a\": {\"b\": [1]}}", "{\"a\": {\"b\": [2]}}");
    }

    @Test
    public void mergesObjectValues() throws IOException {
        test("{\"a\": {\"b\": 1, \"c\": 2}}", "{\"a\": {\"b\": 1}}", "{\"a\": {\"c\": 2}}");
    }

    private void test(String expected, String left, String right) throws IOException {
      assertEquals(objectMapper.readTree(expected), merge((ObjectNode) objectMapper.readTree(left), (ObjectNode) objectMapper.readTree(right)));
  }
}