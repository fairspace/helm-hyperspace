package io.fairspace.portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.Tiller;

import java.io.IOException;

import static io.fairspace.portal.Authentication.getUserInfo;
import static io.fairspace.portal.Config.WORKSPACE_CHART;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.before;
import static spark.Spark.exception;
import static spark.Spark.get;
import static spark.Spark.halt;
import static spark.Spark.path;
import static spark.Spark.port;
import static spark.Spark.put;

@Slf4j
public class App {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final JwtTokenValidator tokenValidator = JwtTokenValidator.create(CONFIG.auth.jwksUrl, CONFIG.auth.jwtAlgorithm);

    public static void main(String[] args) throws IOException {
        var client = new DefaultKubernetesClient();
        var tiller = new Tiller(client);
        var releaseManager = new ReleaseManager(tiller);
        var workspaceService = new WorkspaceService(releaseManager, CONFIG.charts.get(WORKSPACE_CHART), CONFIG.workspace.domainTemplate, CONFIG.workspace.workspaceValues);

        initSpark(workspaceService);
    }

    private static void initSpark(WorkspaceService workspaceService) {
        port(8080);

        if (CONFIG.auth.enabled) {
            before((request, response) -> {
                if (request.uri().equals("/api/v1/health")) {
                    return;
                }

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
                    return workspaceService.listWorkspaces();
                }, mapper::writeValueAsString);

                put("", (request, response) -> {
                    workspaceService.installWorkspace(mapper.readValue(request.body(), Workspace.class));
                    return "";
                }, mapper::writeValueAsString);
            });

            get("/health", (request, response) -> "OK");
        });

        exception(Exception.class, (exception, request, response) -> {
            log.error("Error handling request {} {}", request.requestMethod(), request.uri(), exception);
            response.status(500);
        });
    }
}
