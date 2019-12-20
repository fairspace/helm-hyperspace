package io.fairspace.portal;

import io.javalin.Javalin;
import lombok.extern.slf4j.Slf4j;


@Slf4j
public class App {
    public static void main(String[] args) {
        Javalin.create(config -> config.addStaticFiles("/web"))
                .get("/hi", ctx -> ctx.result("Hello World"))
                .start(8080);
    }
}
