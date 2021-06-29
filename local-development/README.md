# Local development

You can run the chart locally for testing.

## Run Hyperspace using minikube

Please check the [deploy.sh](deploy.sh) script.
It assumes Helm3 to be available in `~/bin/helm3/helm`.

The ingress node will listen to http://keycloak.local, so make sure to add `$(minikube ip) keycloak.local` to `/etc/hosts`:
```shell
echo "$(minikube ip) keycloak.local" >> /etc/hosts
```

To start Hyperspace:
```shell
# Start minikube
minikube start
minikube addons enable ingress

# Open kubernetes dashboard
minikube dashboard

# Push images to minikube repository and start Keycloak
./deploy.sh
```
The script creates the `hyperspace-dev` namespace where all other objects are created.

Keycloak will be available at http://keycloak.local. Login with username `keycloak` and password `keycloak`.
Create a new realm named `fairspace`:
- Click _Add realm_:

  ![Add realm](screenshots/Add%20realm%20button.png)
- Click _Select file_ and import the file [fairspace-realm.json](fairspace-realm.json).

  ![Add realm page](screenshots/Add%20realm%20page.png)

This should create the _fairspace_ realm and configure the _workspace-client_ client for Fairspace.
![Fairspace realm](screenshots/Realm%20created.png)

You need to add users to the realm manually. Please create a user with username `organisation-admin-fairspace`. This user will have superadmin privileges, which allows you to assign privileges to other users in Fairspace (e.g., admin privilege).

To shutdown Keycloak, use one of the following:
```shell
# Uninstall Hyperspace using Helm
helm uninstall hyperspace-local -n hyperspace-dev
# Delete hyperspace-dev namespace
kubectl delete ns hyperspace-dev
```
