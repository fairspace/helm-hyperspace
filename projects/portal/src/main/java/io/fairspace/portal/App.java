package io.fairspace.portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.services.StaticLocalPortForward;
import io.fairspace.portal.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.Tiller;

import java.io.IOException;
import java.net.InetAddress;

import static io.fairspace.portal.Authentication.getUserInfo;
import static io.fairspace.portal.Config.WORKSPACE_CHART;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static org.eclipse.jetty.http.HttpStatus.FORBIDDEN_403;
import static org.eclipse.jetty.http.HttpStatus.UNAUTHORIZED_401;
import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.*;

@Slf4j
public class App {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final JwtTokenValidator tokenValidator = JwtTokenValidator.create(CONFIG.auth.jwksUrl, CONFIG.auth.jwtAlgorithm);

    public static void main(String[] args) throws IOException {
        var localPortForward = new StaticLocalPortForward(InetAddress.getByName(CONFIG.tiller.service), CONFIG.tiller.port);
        var tiller = new Tiller(localPortForward);
        var releaseManager = new ReleaseManager(tiller);
        var workspaceService = new WorkspaceService(releaseManager, CONFIG.charts.get(WORKSPACE_CHART));

        initSpark(workspaceService);
    }

    private static void initSpark(WorkspaceService workspaceService) {
        port(8080);

        before((request, response) -> {
            if (request.uri().equals("/api/v1/health")) {
                return;
            }

            var token = getUserInfo(request, tokenValidator);

            if (token == null) {
                halt(UNAUTHORIZED_401);
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
                        halt(FORBIDDEN_403);
                    }
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
