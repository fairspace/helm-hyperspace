package io.fairspace.portal.errors;

public class ForbiddenException extends Exception {
    public ForbiddenException() {}

    public ForbiddenException(String s) {
        super(s);
    }
}
