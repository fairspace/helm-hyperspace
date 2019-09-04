# Organisation portal backend

This application manages the workspaces in the organisation portal. It consists of a
basic interface that calls [helm](https://helm.sh) using the [microbean library](https://microbean.github.io/microbean-helm/index.html) for deployment of workspaces.

## Configuration
Configuration can be done by adding an `application.yaml` file. The parameters that can be set 
can be found in the [Config.java](src/main/java/io/fairspace/portal/Config.java).

The connection with helm relies on a connection to the kubernetes master API for setting up a 
port-forward to tiller. Our helm chart set up a specific service account that has the
necessary authorizations, which is used without further application configuration. More detailed
configuration of the kubernetes client can be done using environment variables or files. See https://github.com/fabric8io/kubernetes-client#configuring-the-client 
for more information.
