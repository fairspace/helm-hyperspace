package io.fairspace.portal.services;

import io.fabric8.kubernetes.client.LocalPortForward;

import java.io.IOException;
import java.net.InetAddress;

public class StaticLocalPortForward implements LocalPortForward {
    private final InetAddress address;
    private final int port;

    public StaticLocalPortForward(InetAddress address, int port) {
        this.address = address;
        this.port = port;
    }

    @Override
    public InetAddress getLocalAddress() {
        return address;
    }

    @Override
    public int getLocalPort() {
        return port;
    }

    @Override
    public boolean isAlive() {
        return true;
    }

    @Override
    public void close() throws IOException {
    }
}
