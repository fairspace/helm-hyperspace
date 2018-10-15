#!/bin/bash
#
# The specific kube-config file is stored encrypted
#
mkdir -p $HOME/.kube
openssl aes-256-cbc -K $encrypted_4e2f7b28d92d_key -iv $encrypted_4e2f7b28d92d_iv -in ci/kube-config.yml.enc -out $HOME/.kube/config -d
