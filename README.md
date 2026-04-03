# Kubernetes Dashboard for Grafana

A Grafana app plugin that provides a comprehensive Kubernetes cluster dashboard built with [@grafana/scenes](https://github.com/grafana/scenes). Browse, search, and inspect all Kubernetes resources through a card-based UI with drilldown detail views.

## Features

### Resource browsing

Every resource type is presented as paginated, searchable cards with expand-on-click details.

- **Workloads** — Pods, Deployments, Replica Sets, Daemon Sets, Stateful Sets, Jobs, Cron Jobs
- **Networking** — Services, Ingresses, Ingress Classes
- **Config & Storage** — Config Maps, Persistent Volume Claims, Secrets, Storage Classes
- **Cluster** — Nodes, Namespaces, Events, Roles, Role Bindings, Cluster Roles, Cluster Role Bindings, Service Accounts, Network Policies, Persistent Volumes
- **Custom Resource Definitions** — All CRDs with dedicated tabs for Traefik resources (IngressRoutes, Middlewares, TraefikServices)

### Detail views

Click any resource name to drill down into a detail view with tabs for:

- **Overview** — Metadata, labels, annotations, resource-specific information, conditions, containers, related resources
- **YAML** — Raw YAML manifest
- **Logs** — Live pod logs with container filtering, search, log-level color indicators, and a direct link to Loki Explore
- **Events** — Kubernetes events for the resource

### Cards

Resource cards show key information at a glance:

- Status badges with color coding (Ready/NotReady, Running/Pending/Failed, Bound/Available, etc.)
- Resource-specific stats (replica counts, node info, capacity, ports, schedules)
- Expandable chip lists for images, labels, ports, subjects, and access modes
- Click to expand for full details, click the name to navigate to the drilldown

### Search and pagination

- Text search filters cards by name or namespace
- Paginated in groups of 24 or 48 (fills the grid evenly)
- Log search filters by message content

### Observability links

- **Loki** — Pod log views include an "Open in Loki" button that opens Grafana Explore with a pre-filled LogQL query (`{namespace="...", pod="..."}`) using the first available Loki datasource

## Requirements

- Grafana >= 12.4.0
- [kranklab-kubernetes-datasource](https://github.com/kranklab/grafana-kubernetes-datasource) plugin installed and configured

## Getting started

### Frontend

1. Install dependencies

   ```bash
   npm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   npm run dev
   ```

3. Build plugin in production mode

   ```bash
   npm run build
   ```

4. Run the linter

   ```bash
   npm run lint
   ```

### Development

The plugin source is organised as follows:

```
src/
  components/
    ResourceCards/        # Shared card grid component used by all pages
      ResourceCards.tsx   # Universal card renderer with pagination, search, expand
      makeCardsScene.ts   # Helper to build a cards scene for any resource type
    Routes/               # App routing
  pages/
    Home/                 # Cluster overview with stat cards and workload tables
    Workloads/            # Card-based workload browsing with tabs per resource
    Networking/           # Services, Ingresses, Ingress Classes
    ConfigStorage/        # Config Maps, PVCs, Secrets, Storage Classes
    Cluster/              # Cluster-scoped resources
    CRDs/                 # Custom Resource Definitions with Traefik tabs
  plugin.json             # Plugin metadata and navigation structure
  constants.ts            # Route definitions
```

### Adding a new resource tab

To add a new resource type to an existing page, add a `SceneAppPage` tab entry in the page's scene builder using `makeCardsScene`:

```typescript
new SceneAppPage({
  title: 'My Resource',
  url: `${baseUrl}/myresource`,
  getScene: () => makeCardsScene({
    resource: 'myresource',        // K8s API plural name
    resourceType: 'myresource',    // Used for card badge/stats config
    drilldownUrl: `${baseUrl}/myresource/\${namespace}/\${name}`,
  }),
})
```

Then add badge, stats, and chips config for the new type in `ResourceCards.tsx` (`getBadge`, `getStats`, `getChips` functions).

## Plugin signing

When distributing this plugin it must be signed. See the Grafana [plugin publishing and signing criteria](https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria) for details.

The included GitHub Actions release workflow handles signing automatically when a version tag is pushed:

1. Add a `GRAFANA_API_KEY` secret to your repository (Settings > Secrets > Actions)
2. Run `npm version <major|minor|patch>`
3. Run `git push origin main --follow-tags`
