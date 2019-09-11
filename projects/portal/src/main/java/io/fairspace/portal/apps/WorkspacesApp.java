package io.fairspace.portal.apps;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.services.WorkspaceService;
import spark.Request;
import spark.RouteGroup;

import java.util.function.Function;

import static io.fairspace.portal.ConfigLoader.CONFIG;
import static javax.servlet.http.HttpServletResponse.SC_FORBIDDEN;
import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.*;

public class WorkspacesApp implements RouteGroup {
    private static final ObjectMapper mapper = new ObjectMapper();

    private WorkspaceService workspaceService;
    private Function<Request, OAuthAuthenticationToken> tokenProvider;

    public WorkspacesApp(WorkspaceService workspaceService, Function<Request, OAuthAuthenticationToken> tokenProvider) {
        this.workspaceService = workspaceService;
        this.tokenProvider = tokenProvider;
    }

    @Override
    public void addRoutes() {
        get("", (request, response) -> {
            response.type(APPLICATION_JSON.asString());
            return workspaceService.listWorkspaces();
        }, mapper::writeValueAsString);

        put("", (request, response) -> {
            if (CONFIG.auth.enabled) {
                var token = tokenProvider.apply(request);
                if (!token.getAuthorities().contains(CONFIG.auth.organisationAdminRole)) {
                    halt(SC_FORBIDDEN);
                }
            }
            workspaceService.installWorkspace(mapper.readValue(request.body(), Workspace.class));
            return "";
        });
    }
}
