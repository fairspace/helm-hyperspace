package io.fairspace.portal;

import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import spark.Request;

public class Authentication {
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_TOKEN_ATTRIBUTE = "auth_token";

    static OAuthAuthenticationToken getUserInfo(Request request, JwtTokenValidator tokenValidator) {
        OAuthAuthenticationToken authToken = request.attribute(AUTH_TOKEN_ATTRIBUTE);

        if (authToken != null) {
            return authToken;
        }

        var authorizationHeader = request.headers(AUTHORIZATION_HEADER);

        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }

        var token = authorizationHeader.substring(BEARER_PREFIX.length());
        var claims = tokenValidator.parseAndValidate(token);

        if (claims == null) {
            return null;
        }

        authToken = new OAuthAuthenticationToken(token, claims);
        request.attribute(AUTH_TOKEN_ATTRIBUTE, authToken);

        return authToken;
    }
}
