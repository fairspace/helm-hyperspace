{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "fairspaceKeycloak.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "fairspaceKeycloak.fullname" -}}
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
{{- define "fairspaceKeycloak.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "fairspaceKeycloak.labels" -}}
chart: {{ include "fairspaceKeycloak.chart" . }}
release: {{ .Release.Name }}
heritage: {{ .Release.Service }}
helm.sh/chart: {{ include "fairspaceKeycloak.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/release-name: {{ .Release.Name }}
{{- end }}

{{- define "keycloak.prefix" -}}
{{ .Release.Name }}
{{- end -}}

{{/*
Create a name for the tls secret for keycloak
*/}}
{{- define "tlsSecretName" -}}
{{- if .Values.ingress.tls.secretNameOverride -}}
{{- .Values.ingress.tls.secretNameOverride | trunc 63 | trimSuffix "-" -}}
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
{{- if .Values.fairspaceKeycloak.locationOverrides.keycloak -}}
{{- .Values.fairspaceKeycloak.locationOverrides.keycloak -}}
{{- else -}}
{{- if .Values.ingress.tls.enabled -}}
{{- $scheme := "https" -}}
{{- printf "%s://%s" $scheme .Values.ingress.domain -}}
{{- else -}}
{{- $scheme := "http" -}}
{{- printf "%s://%s" $scheme .Values.ingress.domain -}}
{{- end -}}

{{- end -}}
{{- end -}}
