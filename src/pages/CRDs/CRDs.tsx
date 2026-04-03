import React, { useMemo } from 'react';
import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { createDatasourceVariable } from '../../utils/utils.datasource';
import { getWorkloadYamlScene } from '../Home/scenes';
import { MetadataHeader } from '../Home/MetadataHeader';
import { ResourceInfoSection } from '../Home/ResourceInfoSection';
import { CRDNamesSection } from '../Home/CRDNamesSection';
import { CRDVersionsSection } from '../Home/CRDVersionsSection';
import { ConditionsSection } from '../Home/ConditionsSection';
import { ResourceCards } from '../../components/ResourceCards/ResourceCards';
import { makeCardsScene } from '../../components/ResourceCards/makeCardsScene';

function makeClusterVariable() {
  return new SceneVariableSet({
    variables: [createDatasourceVariable()],
  });
}

function getCRDDetailScene(name: string) {
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: new SceneQueryRunner({
      datasource: { type: 'kranklab-kubernetes-datasource', uid: '${ds}' },
      queries: [{ refId: 'A', action: 'get', resource: 'customresourcedefinitions', name }],
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ResourceInfoSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new CRDNamesSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new CRDVersionsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ConditionsSection({}) }),
      ],
    }),
    controls: [new SceneControlsSpacer(), new SceneRefreshPicker({})],
  });
}

function getCRDsCardsScene(baseUrl: string) {
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: new SceneQueryRunner({
      datasource: { type: 'kranklab-kubernetes-datasource', uid: '${ds}' },
      queries: [{ refId: 'A', action: 'list', resource: 'customresourcedefinitions' }],
      maxDataPoints: 100,
    }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneRefreshPicker({ intervals: ['30s', '1m', '5m', '15m'] }),
    ],
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          ySizing: 'content',
          body: new ResourceCards({
            resourceType: 'customresourcedefinitions',
            drilldownUrl: `${baseUrl}/crd/\${name}`,
          }),
        }),
      ],
    }),
  });
}

// Traefik CRD tabs — resource names match the plural form used by the K8s API
const TRAEFIK_TABS = [
  { title: 'Traefik Services', resource: 'traefikservices' },
  { title: 'Middlewares', resource: 'middlewares' },
  { title: 'Ingress Routes', resource: 'ingressroutes' },
];

const getCRDsAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.CRDs);

  const drilldowns = [
    {
      routePath: `${baseUrl}/crd/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `CRD: ${name}`,
          url: `${baseUrl}/crd/${name}`,
          getParentPage: () => parent,
          getScene: () => getCRDDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/crd/${name}/overview`, getScene: () => getCRDDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/crd/${name}/yaml`, getScene: () => getWorkloadYamlScene('customresourcedefinitions', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/cr/:resource/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { resource, namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `${resource}: ${name}`,
          subTitle: `${namespace}/${name}`,
          url: `${baseUrl}/cr/${resource}/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getWorkloadYamlScene(resource, namespace, name),
        });
      },
    },
  ];

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Custom Resource Definitions',
        subTitle: 'All CRDs registered in the cluster.',
        url: baseUrl,
        hideFromBreadcrumbs: false,
        getScene: () => getCRDsCardsScene(baseUrl),
        tabs: [
          new SceneAppPage({
            title: 'Definitions',
            url: `${baseUrl}/definitions`,
            getScene: () => getCRDsCardsScene(baseUrl),
          }),
          ...TRAEFIK_TABS.map(
            (tab) =>
              new SceneAppPage({
                title: tab.title,
                url: `${baseUrl}/${tab.resource}`,
                getScene: () => makeCardsScene({
                  resource: tab.resource,
                  resourceType: tab.resource,
                  drilldownUrl: `${baseUrl}/cr/${tab.resource}/\${namespace}/\${name}`,
                }),
              })
          ),
        ],
        drilldowns,
      }),
    ],
  });
};

const CRDsPage = () => {
  const scene = useMemo(() => getCRDsAppScene(), []);
  return <scene.Component model={scene} />;
};

export default CRDsPage;
