package io.fairspace.portal;

import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

public class Config {
    public List<URI> workspaces = new ArrayList<>();

    public Auth auth = new Auth();

    public static class Auth {
        public boolean enabled = false;

        public URL jwksUrl;

        public String algorithm;
    }
}
