package io.fairspace.portal;

import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import spark.Request;

public class Authentication {
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    static OAuthAuthenticationToken getUserInfo(Request request, JwtTokenValidator tokenValidator) {
        var authorizationHeader = request.headers(AUTHORIZATION_HEADER);

        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }

        var token = authorizationHeader.substring(BEARER_PREFIX.length());
        var claims = tokenValidator.parseAndValidate(token);

        return claims != null ? new OAuthAuthenticationToken(token, claims) : null;
    }
}
