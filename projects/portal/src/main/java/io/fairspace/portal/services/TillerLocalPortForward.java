package io.fairspace.portal.services;

import io.fabric8.kubernetes.client.LocalPortForward;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;

public class TillerLocalPortForward implements LocalPortForward {
    private static final String TILLER_SERVICE = "tiller-deploy.kube-system";
    private static final int TILLER_PORT = 44134;

    private final InetAddress address;

    public TillerLocalPortForward() throws UnknownHostException {
        address = InetAddress.getByName(TILLER_SERVICE);
    }

    @Override
    public InetAddress getLocalAddress() {
        return address;
    }

    @Override
    public int getLocalPort() {
        return TILLER_PORT;
    }

    @Override
    public boolean isAlive() {
        return true;
    }

    @Override
    public void close() throws IOException {
    }
}
