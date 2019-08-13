# A Helm chart for VRE hyperspace
This helm chart will install and setup a VRE hyperspace, including keycloak. 

Contains:
- (optional) Ingress NGINX controller
- Keycloak

## Prerequisites
This chart relies on the following prerequisites:
- If ingress is enabled, an active nginx ingress controller should be present in the cluster. 
- If a TLS certificate is to be obtained automatically, an installation of `cert-manager` should be present in the cluster. See
  https://cert-manager.readthedocs.io/en/latest/getting-started/2-installing.html#with-helm for the easiest way to set it up. Please
  note that the certificate that is being created, relies on a dns01 challenge provider being configured properly, as well as on a 
  certificate issuer being setup. See the [cert-manager docs](https://cert-manager.readthedocs.io) for more information.

## How to install

```
helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/
helm repo update
helm install --name=hyperspace chartmuseum/hyperspace --namespace=hyperspace -f config.yaml
```

Helm install will wait for the pods to be initialized and all jobs being run. Please
note that starting postgres sometimes takes a long time. If it takes longer than 5 minutes
helm install will timeout and not show the installation notes. Besides that, there are no 
problems with the installation. Consider adding `--timeout 600` to increase the timeout.

## Install on minikube
```
helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/
helm repo update
helm install --name=hyperspace chartmuseum/hyperspace --namespace=hyperspace --set hyperspace.ingress.enabled=false  --set keycloak.keycloak.service.type=NodePort --set hyperspace.keycloak.realm=hyperspace
```

To retrieve the port that keycloak is running on, run:
`kubectl get svc hyperspace-keycloak-http --namespace=hyperspace  -o jsonpath="{.spec.ports[0].nodePort}"`

## Configuration
Use `helm ... -f config.yaml` to override default configuration parameters from `values.yaml`.


| Parameter  | Description  | Default |
|---|---|---|
| `hyperspace.name`  | Name of the hyperspace | Fairspace |
| `hyperspace.keycloak.realm`  | Realm to be used within keycloak |  |
| `keycloak.keycloak.service.type`  | [Servicetype](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) for the Keycloak service. |  ClusterIP |
| `hyperspace.organisationadmin.username` | Username for the organisation admin that will be created for this hyperspace | `organisation-admin-<realm>` |
| `hyperspace.organisationadmin.password` | Password for the organisation admin that will be created for this hyperspace | `fairspace123` |
| `ingress.enabled`  | Whether or not an ingress is setup for the hyperspace components. Should be set to false when running locally.  | true  |
| `ingress.domain`   | Domain that is used for setting up the hyperspace. Is used as postfix for the hostname for the specific components. For example setting `fairspace.app` as domain will setup keycloak at `keycloak.fairspace.app`  | hyperspace.ci.test.fairdev.app  |
| `ingress.tls.enabled`  | Whether or not an TLS is enabled on the ingresses for hyperspace  | true  |
| `ingress.tls.secretNameOverride`  | If set, this secret name is used for loading certificates for TLS. | `tls-<release name>` |
| `ingress.tls.certificate.obtain`  | If set, a `Certificate` object will be created, such that [cert-manager](https://cert-manager.readthedocs.io/en/latest/) will request a certificate automatically. | true |

To retrieve the initial user password run:

`kubectl get secret --namespace hyperspace hyperspace-keycloak-http -o jsonpath="{.data.password}" | base64 --decode; echo`

## Upgrading installations
Please note that some values in the chart have a random default. These work fine on first installation, but may break upgrades 
of the chart, as the random values may be computed again. 

Other properties may contain default values, which is not advised to use. For those reasons it is strongly advised to define values for at
least the following properties:

* `keycloak.keycloak.password`
* `keycloak.postgresql.postgresPassword`
