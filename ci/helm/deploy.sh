#!/bin/bash

helm repo add fairspace https://fairspace.github.io/helm-repo
helm repo update
helm upgrade --install hyperspace-ci fairspace/hyperspace --namespace=hyperspace-ci -f ./ci/ci-values.yaml
