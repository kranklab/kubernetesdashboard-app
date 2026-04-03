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

function makeTable(title: string, resource: string, drilldownSlug: string, baseUrl: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(withNameLinks(makeQueryRunner(resource), `${baseUrl}/${drilldownSlug}/\${__value.text}\${__url.params}`))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

function makeNamespacedTable(title: string, resource: string, drilldownSlug: string, baseUrl: string) {
  return PanelBuilders.table()
    .setTitle(title)
    .setData(withNameLinks(makeQueryRunner(resource), `${baseUrl}/${drilldownSlug}/\${__data.fields["Namespace"]}/\${__value.text}\${__url.params}`))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getClusterRoleBindingsTable(baseUrl: string) {
  return makeTable('Cluster Role Bindings', 'clusterrolebindings', 'clusterrolebinding', baseUrl);
}

export function getClusterRolesTable(baseUrl: string) {
  return makeTable('Cluster Roles', 'clusterroles', 'clusterrole', baseUrl);
}

export function getEventsTable(baseUrl: string) {
  return makeTable('Events', 'events', 'event', baseUrl);
}

export function getNamespacesTable(baseUrl: string) {
  return makeTable('Namespaces', 'namespaces', 'namespace', baseUrl);
}

export function getNetworkPoliciesTable(baseUrl: string) {
  return makeNamespacedTable('Network Policies', 'networkpolicies', 'networkpolicy', baseUrl);
}

export function getNodesTable(baseUrl: string) {
  return makeTable('Nodes', 'nodes', 'node', baseUrl);
}

export function getPersistentVolumesTable(baseUrl: string) {
  return makeTable('Persistent Volumes', 'persistentvolumes', 'pv', baseUrl);
}

export function getRoleBindingsTable(baseUrl: string) {
  return makeNamespacedTable('Role Bindings', 'rolebindings', 'rolebinding', baseUrl);
}

export function getRolesTable(baseUrl: string) {
  return makeNamespacedTable('Roles', 'roles', 'role', baseUrl);
}

export function getServiceAccountsTable(baseUrl: string) {
  return makeNamespacedTable('Service Accounts', 'serviceaccounts', 'serviceaccount', baseUrl);
}
