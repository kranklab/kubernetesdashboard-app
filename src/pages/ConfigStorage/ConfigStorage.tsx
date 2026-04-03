import React, { useMemo } from 'react';
import {
  SceneApp,
  SceneAppPage,
} from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { getWorkloadYamlScene } from '../Home/scenes';
import { makeCardsScene } from '../../components/ResourceCards/makeCardsScene';
import {
  getConfigMapDetailScene,
  getPVCDetailScene,
  getSecretDetailScene,
  getStorageClassDetailScene,
} from './scenes';

const getConfigStorageAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.ConfigStorage);

  const drilldowns = [
    {
      routePath: `${baseUrl}/configmap/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Config Map: ${name}`,
          subTitle: `Detailed view of ${namespace}/${name}`,
          url: `${baseUrl}/configmap/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getConfigMapDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/configmap/${namespace}/${name}/overview`, getScene: () => getConfigMapDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/configmap/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('configmaps', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/pvc/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `PVC: ${name}`,
          url: `${baseUrl}/pvc/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getPVCDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/pvc/${namespace}/${name}/overview`, getScene: () => getPVCDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/pvc/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('persistentvolumeclaims', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/secret/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Secret: ${name}`,
          url: `${baseUrl}/secret/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getSecretDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/secret/${namespace}/${name}/overview`, getScene: () => getSecretDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/secret/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('secrets', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/storageclass/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Storage Class: ${name}`,
          url: `${baseUrl}/storageclass/${name}`,
          getParentPage: () => parent,
          getScene: () => getStorageClassDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/storageclass/${name}/overview`, getScene: () => getStorageClassDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/storageclass/${name}/yaml`, getScene: () => getWorkloadYamlScene('storageclasses', null, name) }),
          ],
        });
      },
    },
  ];

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Config and Storage',
        subTitle: 'Config Maps, Persistent Volume Claims, Secrets, and Storage Classes.',
        url: baseUrl,
        hideFromBreadcrumbs: false,
        getScene: () => makeCardsScene({
          resource: 'configmaps',
          resourceType: 'configmaps',
          drilldownUrl: `${baseUrl}/configmap/\${namespace}/\${name}`,
        }),
        tabs: [
          new SceneAppPage({
            title: 'Config Maps',
            url: `${baseUrl}/configmaps`,
            getScene: () => makeCardsScene({
              resource: 'configmaps',
              resourceType: 'configmaps',
              drilldownUrl: `${baseUrl}/configmap/\${namespace}/\${name}`,
            }),
          }),
          new SceneAppPage({
            title: 'Persistent Volume Claims',
            url: `${baseUrl}/pvcs`,
            getScene: () => makeCardsScene({
              resource: 'persistentvolumeclaims',
              resourceType: 'persistentvolumeclaims',
              drilldownUrl: `${baseUrl}/pvc/\${namespace}/\${name}`,
            }),
          }),
          new SceneAppPage({
            title: 'Secrets',
            url: `${baseUrl}/secrets`,
            getScene: () => makeCardsScene({
              resource: 'secrets',
              resourceType: 'secrets',
              drilldownUrl: `${baseUrl}/secret/\${namespace}/\${name}`,
            }),
          }),
          new SceneAppPage({
            title: 'Storage Classes',
            url: `${baseUrl}/storageclasses`,
            getScene: () => makeCardsScene({
              resource: 'storageclasses',
              resourceType: 'storageclasses',
              drilldownUrl: `${baseUrl}/storageclass/\${name}`,
              namespaced: false,
            }),
          }),
        ],
        drilldowns,
      }),
    ],
  });
};

const ConfigStoragePage = () => {
  const scene = useMemo(() => getConfigStorageAppScene(), []);
  return <scene.Component model={scene} />;
};

export default ConfigStoragePage;
