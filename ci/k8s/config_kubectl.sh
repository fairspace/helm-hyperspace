#!/bin/bash
#
# The specific kube-config file is stored encrypted
#
mkdir -p $HOME/.kube
openssl aes-256-cbc -K $encrypted_985abdf32880_key -iv $encrypted_985abdf32880_iv -in ci/kube-config.yml.enc -out $HOME/.kube/config -d
