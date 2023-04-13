#!/bin/bash
#
# This script will add a pod annotations for each project that has
# been built to ensure
# that the pod will be recreated for new SNAPSHOT images
#
# Required env variables:
#   $APPNAME
#   $COMMIT_ID
#
DIR=$(dirname $0)

# If we have no changes at all in any of the projects, we can skip
# pod annotations
if $DIR/build-condition.sh $TRAVIS_COMMIT_RANGE projects/; then
    echo "Adding pod annotations"

    # Remove empty pod annotations
    sed -i -e "s/podAnnotations: { }//" charts/fairspace-keycloak/values.yaml

    # Add a pod annotation in the values.yaml file
    echo -e "\npodAnnotations:" >> charts/fairspace-keycloak/values.yaml
    echo -e "  fairspace-keycloak:\n    commit: \"$COMMIT_ID\"\n" >> charts/fairspace-keycloak/values.yaml
fi
