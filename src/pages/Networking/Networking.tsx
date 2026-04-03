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
  getServiceOverviewScene,
  getIngressOverviewScene,
  getIngressClassOverviewScene,
} from './scenes';

const getNetworkingAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.Networking);

  const drilldowns = [
    {
      routePath: `${baseUrl}/service/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Service: ${name}`,
          subTitle: `Detailed view of ${namespace}/${name}`,
          url: `${baseUrl}/service/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getServiceOverviewScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/service/${namespace}/${name}/overview`, getScene: () => getServiceOverviewScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/service/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('services', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/ingress/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Ingress: ${name}`,
          subTitle: `Detailed view of ${namespace}/${name}`,
          url: `${baseUrl}/ingress/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getIngressOverviewScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/ingress/${namespace}/${name}/overview`, getScene: () => getIngressOverviewScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/ingress/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('ingresses', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/ingressclass/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Ingress Class: ${name}`,
          subTitle: 'Detailed view of the ingress class.',
          url: `${baseUrl}/ingressclass/${name}`,
          getParentPage: () => parent,
          getScene: () => getIngressClassOverviewScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/ingressclass/${name}/overview`, getScene: () => getIngressClassOverviewScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/ingressclass/${name}/yaml`, getScene: () => getWorkloadYamlScene('ingressclasses', null, name) }),
          ],
        });
      },
    },
  ];

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Service',
        subTitle: 'Services, Ingresses, and Ingress Classes across your cluster.',
        url: baseUrl,
        hideFromBreadcrumbs: false,
        getScene: () => makeCardsScene({
          resource: 'services',
          resourceType: 'services',
          drilldownUrl: `${baseUrl}/service/\${namespace}/\${name}`,
        }),
        tabs: [
          new SceneAppPage({
            title: 'Services',
            url: `${baseUrl}/services`,
            getScene: () => makeCardsScene({
              resource: 'services',
              resourceType: 'services',
              drilldownUrl: `${baseUrl}/service/\${namespace}/\${name}`,
            }),
          }),
          new SceneAppPage({
            title: 'Ingresses',
            url: `${baseUrl}/ingresses`,
            getScene: () => makeCardsScene({
              resource: 'ingresses',
              resourceType: 'ingresses',
              drilldownUrl: `${baseUrl}/ingress/\${namespace}/\${name}`,
            }),
          }),
          new SceneAppPage({
            title: 'Ingress Classes',
            url: `${baseUrl}/ingressclasses`,
            getScene: () => makeCardsScene({
              resource: 'ingressclasses',
              resourceType: 'ingressclasses',
              drilldownUrl: `${baseUrl}/ingressclass/\${name}`,
              namespaced: false,
            }),
          }),
        ],
        drilldowns,
      }),
    ],
  });
};

const NetworkingPage = () => {
  const scene = useMemo(() => getNetworkingAppScene(), []);
  return <scene.Component model={scene} />;
};

export default NetworkingPage;
