# A Helm chart for VRE hyperspace

Contains:
- Ingress NGINX controller
- Keycloak

To install:

```
helm repo add fairspace https://fairspace.github.io/helm-repo
helm repo update
helm install --name=hyperspace fairspace/hyperspace --namespace=hyperspace

```
