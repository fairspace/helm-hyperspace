# A Helm chart for VRE hyperspace
This helm chart will install and setup a VRE hyperspace, including keycloak.

See `hyperspace/README.md` for more information

# Deployment scripts
Deployment scripts can be found in the `ci` directory. They are
run by travis-ci, as setup in the `travis.yml` file.

Please note that the `kube-config.yml.enc` file is encrypted. This file contains
credentials for our AKS clusters. See the `Updating Travis Kubernetes config`
section of https://wiki.thehyve.nl/display/VRE/Deploying+Fairspace+on+Azure for
information about how to change it.
