package io.fairspace.portal.errors;

public class ConflictException extends RuntimeException {
    public ConflictException() {}

    public ConflictException(String s) {
        super(s);
    }
}
