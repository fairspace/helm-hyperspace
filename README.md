# A Helm chart for VRE hyperspace

Contains:
- Ingress NGINX controller
- Keycloak

## To install:

```
helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/
helm repo update
helm install --name=hyperspace chartmuseum/hyperspace --namespace=hyperspace

```

## Configuration
Use `helm install --name=hyperspace chartmuseum/hyperspace --namespace=hyperspace -f config.yaml` to override default configuration parameters from `values.yaml`.

Important parameters:

- `keycloak.keycloak.service.type:` - Use NodePort if you want Keycloak to be available directly (without Ingress) otherwise use ClusterIP
- `keycloak.keycloak.ingress.enabled:` - Enables or disables Ingress
- `keycloak.keycloak.ingress.hosts:` - List of host addresses to route to Keycloak, e.g. `["keycloak.hyperspace.ci.test.fairdev.app"]`
- `keycloak.keycloak.ingress.tls.hosts:` - List of TLS-enabled hosts
- `keycloak.keycloak.ingress.tls.secretName:` - TLS secret
- `ingress.controller.required:` - if `true` installs Ingress Controller


To retrieve the initial user password run:
`kubectl get secret --namespace hyperspace hyperspace-keycloak-http -o jsonpath="{.data.password}" | base64 --decode; echo`



