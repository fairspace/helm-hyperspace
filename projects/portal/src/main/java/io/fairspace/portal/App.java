package io.fairspace.portal;

import com.fasterxml.jackson.databind.JsonMappingException;
import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import io.fairspace.portal.apps.WorkspacesApp;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.services.CachedReleaseList;
import io.fairspace.portal.services.ChartRepo;
import io.fairspace.portal.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;

import java.io.IOException;
import java.util.List;

import static io.fairspace.portal.Authentication.getUserInfo;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static io.fairspace.portal.errors.ErrorHelper.errorBody;
import static io.fairspace.portal.errors.ErrorHelper.exceptionHandler;
import static java.lang.String.format;
import static java.lang.String.join;
import static java.util.stream.Collectors.toList;
import static javax.servlet.http.HttpServletResponse.*;
import static spark.Spark.*;

@Slf4j
public class App {
    private static final JwtTokenValidator tokenValidator = JwtTokenValidator.create(CONFIG.auth.jwksUrl, CONFIG.auth.jwtAlgorithm);
    private static final String USER_ROLE_PREFIX = "user-";

    public static void main(String[] args) throws IOException {
        initSpark();
    }

    private static void initSpark() throws IOException {
        port(8080);

        if (CONFIG.auth.enabled) {
            before((request, response) -> {
                if (request.uri().equals("/api/v1/health")) {
                    return;
                }

                var token = getUserInfo(request, tokenValidator);

                if (token == null) {
                    halt(SC_UNAUTHORIZED);
                }
            });
        }

        // Setup workspaces app
        ReleaseManager releaseManager = TillerConnectionFactory.getReleaseManager();
        ChartRepo repo = new ChartRepo(CONFIG.charts);
        CachedReleaseList releaseList = new CachedReleaseList(releaseManager);
        WorkspacesApp workspacesApp = new WorkspacesApp(
                new WorkspaceService(releaseManager, releaseList, repo, CONFIG.domain, CONFIG.defaultConfig),
                (request) -> getUserInfo(request, tokenValidator)
        );

        path("/api/v1", () -> {
            path("/workspaces", workspacesApp);
            get("/health", (request, response) -> "OK");
            post("/search/hyperspace/_search", (request, response) -> {
                var token = getUserInfo(request, tokenValidator);
                var indices = getAvailableWorkspaces(token);
                response.redirect(format(CONFIG.elasticSearchUrlTemplate, join(",", indices)));
                return "";
            });
        });

        notFound((req, res) -> errorBody(SC_NOT_FOUND, "Not found"));
        exception(JsonMappingException.class, exceptionHandler(SC_BAD_REQUEST, "Invalid request body"));
        exception(IllegalArgumentException.class, exceptionHandler(SC_BAD_REQUEST, null));
        exception(NotFoundException.class, exceptionHandler(SC_NOT_FOUND, "Not found"));
        exception(Exception.class, exceptionHandler(SC_INTERNAL_SERVER_ERROR, "Internal server error"));
    }

    private static  List<String> getAvailableWorkspaces(OAuthAuthenticationToken authToken) {
        return authToken.getAuthorities()
                .stream()
                .filter(role -> role.startsWith(USER_ROLE_PREFIX))
                .map(role -> role.substring(USER_ROLE_PREFIX.length()))
                .collect(toList());
    }
}
