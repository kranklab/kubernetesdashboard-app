import React, { useMemo } from 'react';
import {
  DataSourceVariable,
  EmbeddedScene,
  QueryVariable,
  SceneApp,
  SceneAppPage,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import {
  getClusterRoleBindingsTable,
  getClusterRolesTable,
  getEventsTable,
  getNamespacesTable,
  getNetworkPoliciesTable,
  getNodesTable,
  getPersistentVolumesTable,
  getRoleBindingsTable,
  getRolesTable,
  getServiceAccountsTable,
} from './panels';
import {
  getClusterRoleBindingDetailScene,
  getClusterRoleDetailScene,
  getEventDetailScene,
  getNamespaceDetailScene,
  getNetworkPolicyDetailScene,
  getNodeDetailScene,
  getPersistentVolumeDetailScene,
  getRoleBindingDetailScene,
  getRoleDetailScene,
  getServiceAccountDetailScene,
} from './scenes';

const TABLE_HEIGHT = 300;

const getClusterScene = () => {
  const dsVariable = new DataSourceVariable({
    name: 'ds',
    pluginId: 'kranklab-kubernetes-datasource',
    label: 'Cluster',
  });

  const namespaceVariable = new QueryVariable({
    name: 'namespace',
    label: 'Namespace',
    datasource: {
      type: 'kranklab-kubernetes-datasource',
      uid: '${ds}',
    },
    query: {
      refId: 'namespaces',
      action: 'list',
      resource: 'namespaces',
    },
    includeAll: true,
    defaultToAll: true,
    allValue: '_all',
  });

  return new EmbeddedScene({
    $variables: new SceneVariableSet({ variables: [dsVariable, namespaceVariable] }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneRefreshPicker({ intervals: ['30s', '1m', '5m', '15m'] }),
    ],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getClusterRoleBindingsTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getClusterRolesTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getEventsTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getNamespacesTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getNetworkPoliciesTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getNodesTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getPersistentVolumesTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getRoleBindingsTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getRolesTable() }),
        new SceneFlexItem({ height: TABLE_HEIGHT, body: getServiceAccountsTable() }),
      ],
    }),
  });
};

const getClusterAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.Cluster);

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Cluster',
        subTitle: 'Cluster-wide resources including roles, nodes, namespaces, and policies.',
        url: baseUrl,
        hideFromBreadcrumbs: true,
        getScene: getClusterScene,
        drilldowns: [
          {
            routePath: `${baseUrl}/clusterrolebinding/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Cluster Role Binding: ${name}`,
                url: `${baseUrl}/clusterrolebinding/${name}`,
                getParentPage: () => parent,
                getScene: () => getClusterRoleBindingDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/clusterrole/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Cluster Role: ${name}`,
                url: `${baseUrl}/clusterrole/${name}`,
                getParentPage: () => parent,
                getScene: () => getClusterRoleDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/event/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Event: ${name}`,
                url: `${baseUrl}/event/${name}`,
                getParentPage: () => parent,
                getScene: () => getEventDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/namespace/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Namespace: ${name}`,
                url: `${baseUrl}/namespace/${name}`,
                getParentPage: () => parent,
                getScene: () => getNamespaceDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/networkpolicy/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Network Policy: ${name}`,
                url: `${baseUrl}/networkpolicy/${name}`,
                getParentPage: () => parent,
                getScene: () => getNetworkPolicyDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/node/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Node: ${name}`,
                url: `${baseUrl}/node/${name}`,
                getParentPage: () => parent,
                getScene: () => getNodeDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/pv/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Persistent Volume: ${name}`,
                url: `${baseUrl}/pv/${name}`,
                getParentPage: () => parent,
                getScene: () => getPersistentVolumeDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/rolebinding/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Role Binding: ${name}`,
                url: `${baseUrl}/rolebinding/${name}`,
                getParentPage: () => parent,
                getScene: () => getRoleBindingDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/role/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Role: ${name}`,
                url: `${baseUrl}/role/${name}`,
                getParentPage: () => parent,
                getScene: () => getRoleDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/serviceaccount/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Service Account: ${name}`,
                url: `${baseUrl}/serviceaccount/${name}`,
                getParentPage: () => parent,
                getScene: () => getServiceAccountDetailScene(name),
              });
            },
          },
        ],
      }),
    ],
  });
};

const ClusterPage = () => {
  const scene = useMemo(() => getClusterAppScene(), []);
  return <scene.Component model={scene} />;
};

export default ClusterPage;