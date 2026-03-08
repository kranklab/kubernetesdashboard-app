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
  getServicesTable,
  getIngressesTable,
  getIngressClassesTable,
} from './panels';
import {
  getServiceOverviewScene,
  getIngressOverviewScene,
  getIngressClassOverviewScene,
} from './scenes';

const TABLE_HEIGHT = 300;

const getNetworkingScene = () => {
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
        new SceneFlexItem({
          height: TABLE_HEIGHT,
          body: getServicesTable(),
        }),
        new SceneFlexItem({
          height: TABLE_HEIGHT,
          body: getIngressesTable(),
        }),
        new SceneFlexItem({
          height: TABLE_HEIGHT,
          body: getIngressClassesTable(),
        }),
      ],
    }),
  });
};

const getNetworkingAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.Networking);

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Networking',
        subTitle: 'Services, Ingresses, and Ingress Classes across your cluster.',
        url: baseUrl,
        hideFromBreadcrumbs: true,
        getScene: getNetworkingScene,
        drilldowns: [
          {
            routePath: `${baseUrl}/service/:namespace/:name`,
            getPage(routeMatch, parent) {
              const { namespace, name } = routeMatch.params;
              return new SceneAppPage({
                title: `Service: ${name}`,
                subTitle: `Detailed view of ${namespace}/${name}`,
                url: `${baseUrl}/service/${namespace}/${name}`,
                getParentPage: () => parent,
                getScene: () => getServiceOverviewScene(namespace, name),
              });
            },
          },
          {
            routePath: `${baseUrl}/ingress/:namespace/:name`,
            getPage(routeMatch, parent) {
              const { namespace, name } = routeMatch.params;
              return new SceneAppPage({
                title: `Ingress: ${name}`,
                subTitle: `Detailed view of ${namespace}/${name}`,
                url: `${baseUrl}/ingress/${namespace}/${name}`,
                getParentPage: () => parent,
                getScene: () => getIngressOverviewScene(namespace, name),
              });
            },
          },
          {
            routePath: `${baseUrl}/ingressclass/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Ingress Class: ${name}`,
                subTitle: 'Detailed view of the ingress class.',
                url: `${baseUrl}/ingressclass/${name}`,
                getParentPage: () => parent,
                getScene: () => getIngressClassOverviewScene(name),
              });
            },
          },
        ],
      }),
    ],
  });
};

const NetworkingPage = () => {
  const scene = useMemo(() => getNetworkingAppScene(), []);
  return <scene.Component model={scene} />;
};

export default NetworkingPage;
