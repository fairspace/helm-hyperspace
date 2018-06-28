# A Helm chart for VRE hyperspace

Contains:
- Ingress NGINX controller
- Keycloak

To install:

```
helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/
helm repo update
helm install --name=hyperspace chartmuseum/hyperspace --namespace=hyperspace

```
