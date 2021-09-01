#!/usr/bin/env bash

here=$(realpath $(dirname "${0}"))
helm_cmd=$(realpath ~/bin/helm3/helm)

# Prerequisites:
# $ minikube start
# $ minikube addons enable ingress

pushd "${here}"

(kubectl get ns keycloak-dev || kubectl create ns keycloak-dev) && \
((${helm_cmd} repo list | cut -f1 | grep '^codecentric') || ${helm_cmd} repo add codecentric https://codecentric.github.io/helm-charts) && \
${helm_cmd} dependency update ../charts/keycloak && \
${helm_cmd} package ../charts/keycloak && \
${helm_cmd} upgrade keycloak-local --install --namespace keycloak-dev fairspace-keycloak-0.0.0-RELEASEVERSION.tgz \
  -f local-values.yaml

popd
