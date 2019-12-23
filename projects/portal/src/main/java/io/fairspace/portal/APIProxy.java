package io.fairspace.portal;

import org.eclipse.jetty.proxy.ProxyServlet;

import javax.servlet.http.HttpServletRequest;

public class APIProxy extends ProxyServlet {

    @Override
    protected String rewriteTarget(HttpServletRequest clientRequest) {
        return getWorkspaceUrl(clientRequest) + clientRequest.getRequestURI();
    }

    private String getWorkspaceUrl(HttpServletRequest clientRequest) {
        // TODO: Fix me
        return "http://localhost:8081";
    }
}
