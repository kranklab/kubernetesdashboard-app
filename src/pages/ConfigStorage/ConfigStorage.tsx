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
  getConfigMapsTable,
  getPersistentVolumeClaimsTable,
  getSecretsTable,
  getStorageClassesTable,
} from './panels';
import {
  getConfigMapDetailScene,
  getPVCDetailScene,
  getSecretDetailScene,
  getStorageClassDetailScene,
} from './scenes';

const TABLE_HEIGHT = 300;

const getConfigStorageScene = () => {
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
          body: getConfigMapsTable(),
        }),
        new SceneFlexItem({
          height: TABLE_HEIGHT,
          body: getPersistentVolumeClaimsTable(),
        }),
        new SceneFlexItem({
          height: TABLE_HEIGHT,
          body: getSecretsTable(),
        }),
        new SceneFlexItem({
          height: TABLE_HEIGHT,
          body: getStorageClassesTable(),
        }),
      ],
    }),
  });
};

const getConfigStorageAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.ConfigStorage);

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Config & Storage',
        subTitle: 'Config Maps, Persistent Volume Claims, Secrets, and Storage Classes.',
        url: baseUrl,
        hideFromBreadcrumbs: true,
        getScene: getConfigStorageScene,
        drilldowns: [
          {
            routePath: `${baseUrl}/configmap/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Config Map: ${name}`,
                url: `${baseUrl}/configmap/${name}`,
                getParentPage: () => parent,
                getScene: () => getConfigMapDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/pvc/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `PVC: ${name}`,
                url: `${baseUrl}/pvc/${name}`,
                getParentPage: () => parent,
                getScene: () => getPVCDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/secret/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Secret: ${name}`,
                url: `${baseUrl}/secret/${name}`,
                getParentPage: () => parent,
                getScene: () => getSecretDetailScene(name),
              });
            },
          },
          {
            routePath: `${baseUrl}/storageclass/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `Storage Class: ${name}`,
                url: `${baseUrl}/storageclass/${name}`,
                getParentPage: () => parent,
                getScene: () => getStorageClassDetailScene(name),
              });
            },
          },
        ],
      }),
    ],
  });
};

const ConfigStoragePage = () => {
  const scene = useMemo(() => getConfigStorageAppScene(), []);
  return <scene.Component model={scene} />;
};

export default ConfigStoragePage;
