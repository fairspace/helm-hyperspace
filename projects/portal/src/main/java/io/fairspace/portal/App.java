package io.fairspace.portal;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.services.WorkspaceService;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.Tiller;

import java.io.IOException;

import static io.fairspace.portal.Authentication.getUserInfo;
import static io.fairspace.portal.Config.WORKSPACE_CHART;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static io.fairspace.portal.errors.ErrorHelper.errorBody;
import static io.fairspace.portal.errors.ErrorHelper.exceptionHandler;
import static javax.servlet.http.HttpServletResponse.*;
import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.*;

@Slf4j
public class App {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final JwtTokenValidator tokenValidator = JwtTokenValidator.create(CONFIG.auth.jwksUrl, CONFIG.auth.jwtAlgorithm);

    public static void main(String[] args) throws IOException {
        initSpark(initWorkspaceService());
    }

    private static WorkspaceService initWorkspaceService() throws IOException {
        ReleaseManager releaseManager;

        try {
            var client = new DefaultKubernetesClient();
            var tiller = new Tiller(client);
            releaseManager = new ReleaseManager(tiller);
        } catch(Exception e) {
            log.error("Error while initializing release manager for tiller.", e);
            throw e;
        }

        return new WorkspaceService(releaseManager, CONFIG.charts.get(WORKSPACE_CHART));
    }

    private static void initSpark(@NonNull WorkspaceService workspaceService) {
        port(8080);

        before((request, response) -> {
            if (request.uri().equals("/api/v1/health")) {
                return;
            }

            var token = getUserInfo(request, tokenValidator);

            if (token == null) {
                halt(SC_UNAUTHORIZED);
            }
        });

        path("/api/v1", () -> {
            path("/workspaces", () -> {
                get("", (request, response) -> {
                    response.type(APPLICATION_JSON.asString());
                    return workspaceService.listWorkspaces();
                }, mapper::writeValueAsString);

                put("", (request, response) -> {
                    var token = getUserInfo(request, tokenValidator);
                    if (!token.getAuthorities().contains(CONFIG.auth.organisationAdminRole)) {
                        halt(SC_FORBIDDEN);
                    }
                    workspaceService.installWorkspace(mapper.readValue(request.body(), Workspace.class));
                    return "";
                }, mapper::writeValueAsString);
            });

            get("/health", (request, response) -> "OK");
        });

        notFound((req, res) -> errorBody(SC_NOT_FOUND, "Not found"));
        exception(JsonMappingException.class, exceptionHandler(SC_BAD_REQUEST, "Invalid request body"));
        exception(IllegalArgumentException.class, exceptionHandler(SC_BAD_REQUEST, null));
        exception(Exception.class, exceptionHandler(SC_INTERNAL_SERVER_ERROR, "Internal server error"));
    }
}
