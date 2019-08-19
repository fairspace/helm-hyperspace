package io.fairspace.portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.fairspace.oidc_auth.JwtTokenValidator;

import static io.fairspace.portal.Authentication.getUserInfo;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.*;

public class App {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final JwtTokenValidator tokenValidator = JwtTokenValidator.create(CONFIG.auth.jwksUrl, CONFIG.auth.jwtAlgorithm);;

    public static void main(String[] args) {
        initSpark();
    }

    private static void initSpark() {
        port(8080);

        if (CONFIG.auth.enabled) {
            before((request, response) -> {
                var token = getUserInfo(request, tokenValidator);
                if (token == null) {
                    halt(401);
                }
            });
        }

        path("/api/v1", () -> {
            path("/workspaces", () -> {
                get("", (request, response) -> {
                    response.type(APPLICATION_JSON.asString());
                    return CONFIG.workspaces;
                }, mapper::writeValueAsString);
            });
        });
    }
}
