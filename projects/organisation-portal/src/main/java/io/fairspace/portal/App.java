package io.fairspace.portal;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.services.WorkspaceService;

import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.*;

public class App {

    public static void main(String[] args) {
        var workspaceService = new WorkspaceService();

        var mapper = new ObjectMapper();

        port(8080);
        before((request, response) -> {
            // TODO: Authorization
        });
        path("/workspaces", () -> {
            get("", (request, response) -> {
                response.type(APPLICATION_JSON.asString());
                return mapper.writeValueAsString(workspaceService.listWorkspaces());
            });
            put("", (request, response) -> {
                response.type(APPLICATION_JSON.asString());
                return mapper.writeValueAsString(workspaceService.addWorkspace(mapper.readValue(request.body(), Workspace.class)));
            });
        });
    }
}
