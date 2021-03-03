{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "hyperspace.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "hyperspace.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "hyperspace.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "keycloak.prefix" -}}
{{- printf "%s-%s" .Release.Name "keycloak" | trunc 20 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a name for the tls secret for hyperspace
*/}}
{{- define "hyperspace.tlsSecretName" -}}
{{- if .Values.hyperspace.ingress.tls.secretNameOverride -}}
{{- .Values.hyperspace.ingress.tls.secretNameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- printf "tls-%s" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "tls-%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create the keycloak baseUrl, either by using the override value or constructing it ourselves
*/}}
{{- define "keycloak.baseUrl" -}}
{{- if .Values.hyperspace.locationOverrides.keycloak -}}
{{- .Values.hyperspace.locationOverrides.keycloak -}}
{{- else -}}
{{- if .Values.hyperspace.ingress.tls.enabled -}}
{{- $scheme := "https" -}}
{{- printf "%s://keycloak.%s" $scheme .Values.hyperspace.ingress.domain -}}
{{- else -}}
{{- $scheme := "http" -}}
{{- printf "%s://keycloak.%s" $scheme .Values.hyperspace.ingress.domain -}}
{{- end -}}

{{- end -}}
{{- end -}}

{{- define "pluto.fullname" -}}
{{- .Values.pluto.nameOverride | default (printf "%s-pluto" .Release.Name) -}}
{{- end -}}
