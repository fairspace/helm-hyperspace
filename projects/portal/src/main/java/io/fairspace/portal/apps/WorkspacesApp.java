package io.fairspace.portal.apps;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.WorkspaceAppService;
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
    private WorkspaceAppService workspaceAppService;
    private Function<Request, OAuthAuthenticationToken> tokenProvider;

    public WorkspacesApp(WorkspaceService workspaceService, WorkspaceAppService workspaceAppService , Function<Request, OAuthAuthenticationToken> tokenProvider) {
        this.workspaceService = workspaceService;
        this.workspaceAppService = workspaceAppService;
        this.tokenProvider = tokenProvider;
    }

    @Override
    public void addRoutes() {
        get("", (request, response) -> {
            response.type(APPLICATION_JSON.asString());
            return workspaceService.listWorkspaces();
        }, mapper::writeValueAsString);

        get("/:workspaceId", (request, response) -> {
            response.type(APPLICATION_JSON.asString());
            return workspaceService
                    .getWorkspace(request.params(":workspaceId"))
                    .orElse(null);
        }, mapper::writeValueAsString);

        delete("/:workspaceId", (request, response) -> {
            requireOrganisationAdmin(request);

            workspaceService
                    .uninstallWorkspace(request.params(":workspaceId"));

            return "";
        });


        put("", (request, response) -> {
            requireOrganisationAdmin(request);
            workspaceService.installWorkspace(mapper.readValue(request.body(), Workspace.class));
            return "";
        });

        patch("", (request, response) -> {
            requireOrganisationAdmin(request);
            workspaceService.updateWorkspace(mapper.readValue(request.body(), Workspace.class));
            return "";
        });

        get("/:workspaceId/apps", (request, response) -> {
            response.type(APPLICATION_JSON.asString());
            return workspaceService
                    .getWorkspace(request.params(":workspaceId"))
                    .map(Workspace::getApps)
                    .orElse(null);
        }, mapper::writeValueAsString);

        put("/:workspaceId/apps", (request, response) -> {
            requireOrganisationAdmin(request);

            var workspaceApp = mapper.readValue(request.body(), WorkspaceApp.class);

            if(workspaceApp.getId() == null) {
                throw new IllegalArgumentException("No identifier provided for app to install");
            }

            workspaceAppService.installApp(request.params(":workspaceId"), workspaceApp);
            return "";
        });

        delete("/:workspaceId/apps/:appId", (request, response) -> {
            requireOrganisationAdmin(request);

            workspaceAppService.uninstallApp(request.params(":appId"));
            return "";
        });
    }

    private void requireOrganisationAdmin(Request request) {
        if (CONFIG.auth.enabled) {
            var token = tokenProvider.apply(request);
            if (!token.getAuthorities().contains(CONFIG.auth.organisationAdminRole)) {
                halt(SC_FORBIDDEN);
            }
        }
    }

}
