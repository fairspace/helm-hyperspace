package io.fairspace.portal.errors;

import lombok.Value;

@Value
public class ErrorDto {
    private int status;
    private String message;
}
