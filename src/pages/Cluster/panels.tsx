import {
  PanelBuilders,
  SceneQueryRunner,
} from '@grafana/scenes';
import { withNameLinks } from '../../utils/utils.links';

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
    .setData(withNameLinks(makeQueryRunner(resource), `\${__url.path}/${drilldownSlug}/\${__value.text}\${__url.params}`))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

function makeNamespacedTable(title: string, resource: string, drilldownSlug: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(withNameLinks(makeQueryRunner(resource), `\${__url.path}/${drilldownSlug}/\${__data.fields["Namespace"]}/\${__value.text}\${__url.params}`))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
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
  return makeNamespacedTable('Network Policies', 'networkpolicies', 'networkpolicy');
}

export function getNodesTable() {
  return makeTable('Nodes', 'nodes', 'node');
}

export function getPersistentVolumesTable() {
  return makeTable('Persistent Volumes', 'persistentvolumes', 'pv');
}

export function getRoleBindingsTable() {
  return makeNamespacedTable('Role Bindings', 'rolebindings', 'rolebinding');
}

export function getRolesTable() {
  return makeNamespacedTable('Roles', 'roles', 'role');
}

export function getServiceAccountsTable() {
  return makeNamespacedTable('Service Accounts', 'serviceaccounts', 'serviceaccount');
}
