# Kubernetes Dashboard

A Grafana app plugin that provides a comprehensive Kubernetes cluster dashboard. Browse, search, and inspect every 
Kubernetes resource through a card-based UI.

![Cluster overview](https://raw.githubusercontent.com/kranklab/kubernetesdashboard-app/main/src/img/overview.png)

## Overview

Kubernetes Dashboard turns Grafana into a Kubernetes browser. Every resource type is rendered as paginated, searchable 
cards with status badges, key stats, and expand-on-click details. Click a resource to drill into a detail view 
with metadata, raw YAML, live logs, and events.

The plugin uses the [kranklab-kubernetes-datasource](https://github.com/kranklab/grafana-kubernetes-datasource) to talk 
to your cluster, so resource access is controlled by the datasource credentials and Kubernetes RBAC.

## Features

### Resource browsing

- **Workloads** — Pods, Deployments, Replica Sets, Daemon Sets, Stateful Sets, Jobs, Cron Jobs
- **Networking** — Services, Ingresses, Ingress Classes
- **Config & Storage** — Config Maps, Persistent Volume Claims, Secrets, Storage Classes
- **Cluster** — Nodes, Namespaces, Events, Roles, Role Bindings, Cluster Roles, Cluster Role Bindings, Service Accounts, Network Policies, Persistent Volumes
- **Custom Resource Definitions** — All CRDs with dedicated tabs for Traefik resources (IngressRoutes, Middlewares, TraefikServices)

![Deployments](https://raw.githubusercontent.com/kranklab/kubernetesdashboard-app/main/src/img/deployments.png)

### Detail views

Click any resource name to open a tabbed detail view:

- **Overview** — Metadata, labels, annotations, conditions, containers, related resources
- **YAML** — Raw YAML manifest
- **Logs** — Live pod logs with container filtering, search, log-level color indicators, and an "Open in Loki" button that jumps to Grafana Explore with a pre-filled LogQL query
- **Events** — Kubernetes events scoped to the resource

![Configs and storage](https://raw.githubusercontent.com/kranklab/kubernetesdashboard-app/main/src/img/configs-and-storage.png)

## Requirements

- Grafana >= 12.4.0
- [kranklab-kubernetes-datasource](https://github.com/kranklab/grafana-kubernetes-datasource) plugin installed and configured against your cluster

## Getting started

1. Install the [kranklab-kubernetes-datasource](https://github.com/kranklab/grafana-kubernetes-datasource) plugin and configure it with credentials for your cluster.
2. Install the Kubernetes Dashboard plugin from the Grafana plugin catalog.
3. Enable the app from **Administration → Plugins and data → Plugins**.
4. Open the **Kubernetes Dashboard** app from the navigation menu.
