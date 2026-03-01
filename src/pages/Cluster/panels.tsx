import {
  PanelBuilders,
  SceneQueryRunner,
} from '@grafana/scenes';

function makeQueryRunner(resource: string): SceneQueryRunner {
  return new SceneQueryRunner({
    datasource: {
      type: 'kranklab-kubernetes-datasource',
      uid: '${ds}',
    },
    queries: [
      {
        refId: 'A',
        action: 'list',
        namespace: '${namespace}',
        resource,
      },
    ],
    maxDataPoints: 100,
  });
}

export function makeDetailQueryRunner(resource: string, name: string): SceneQueryRunner {
  return new SceneQueryRunner({
    datasource: {
      type: 'kranklab-kubernetes-datasource',
      uid: '${ds}',
    },
    queries: [
      {
        refId: 'A',
        action: 'get',
        namespace: '${namespace}',
        resource,
        name,
      },
    ],
    maxDataPoints: 100,
  });
}

function makeTable(title: string, resource: string, drilldownSlug: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(makeQueryRunner(resource))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: `View ${title}`,
          url: `\${__url.path}/${drilldownSlug}/\${__value.text}\${__url.params}`,
        },
      ]);
    })
    .build();
}

export function getClusterRoleBindingsTable() {
  return makeTable('Cluster Role Bindings', 'clusterrolebindings', 'clusterrolebinding');
}

export function getClusterRolesTable() {
  return makeTable('Cluster Roles', 'clusterroles', 'clusterrole');
}

export function getEventsTable() {
  return makeTable('Events', 'events', 'event');
}

export function getNamespacesTable() {
  return makeTable('Namespaces', 'namespaces', 'namespace');
}

export function getNetworkPoliciesTable() {
  return makeTable('Network Policies', 'networkpolicies', 'networkpolicy');
}

export function getNodesTable() {
  return makeTable('Nodes', 'nodes', 'node');
}

export function getPersistentVolumesTable() {
  return makeTable('Persistent Volumes', 'persistentvolumes', 'pv');
}

export function getRoleBindingsTable() {
  return makeTable('Role Bindings', 'rolebindings', 'rolebinding');
}

export function getRolesTable() {
  return makeTable('Roles', 'roles', 'role');
}

export function getServiceAccountsTable() {
  return makeTable('Service Accounts', 'serviceaccounts', 'serviceaccount');
}