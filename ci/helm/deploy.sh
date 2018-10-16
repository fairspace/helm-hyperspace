#!/bin/bash

ENVIRONMENT=${1:-ci}

helm upgrade --install hyperspace-${ENVIRONMENT} fairspace/hyperspace --namespace=hyperspace-${ENVIRONMENT} --version $VERSION -f ./ci/config/${ENVIRONMENT}-values.yaml
