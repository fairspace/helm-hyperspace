package io.fairspace.portal;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ContextHandlerCollection;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;


@Slf4j
public class App {
    public static void main(String[] args) {
        Javalin.create(config ->
                config.server(App::server)
                .addSinglePageRoot("/", "web/index.html")
                .addStaticFiles("/web")
                .addStaticFiles("config", Location.EXTERNAL)
        ).start(8080);
    }

    private static Server server() {
        var server = new Server();
        var context = new ServletContextHandler();
        context.setContextPath("/api/v1");
        context.addServlet(new ServletHolder(new APIProxy()), "/");
        var handlers = new ContextHandlerCollection();
        handlers.setHandlers(new Handler[]{context});
        server.setHandler(handlers);
        return server;
    }
}
