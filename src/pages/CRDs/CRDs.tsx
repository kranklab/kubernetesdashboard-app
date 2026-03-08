import React, { useMemo } from 'react';
import {
  DataSourceVariable,
  EmbeddedScene,
  PanelBuilders,
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
import { withNameLinks } from '../../utils/utils.links';
import { MetadataHeader } from '../Home/MetadataHeader';
import { ResourceInfoSection } from '../Home/ResourceInfoSection';
import { CRDNamesSection } from '../Home/CRDNamesSection';
import { CRDVersionsSection } from '../Home/CRDVersionsSection';
import { ConditionsSection } from '../Home/ConditionsSection';

const TABLE_HEIGHT = 500;

function makeClusterVariable() {
  return new SceneVariableSet({
    variables: [
      new DataSourceVariable({
        name: 'ds',
        pluginId: 'kranklab-kubernetes-datasource',
        label: 'Cluster',
      }),
    ],
  });
}

function getCRDDetailScene(name: string) {
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: new SceneQueryRunner({
      datasource: {
        type: 'kranklab-kubernetes-datasource',
        uid: '${ds}',
      },
      queries: [
        {
          refId: 'A',
          action: 'get',
          resource: 'customresourcedefinitions',
          name,
        },
      ],
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
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

const getCRDsScene = () => {
  const dsVariable = new DataSourceVariable({
    name: 'ds',
    pluginId: 'kranklab-kubernetes-datasource',
    label: 'Cluster',
  });

  return new EmbeddedScene({
    $variables: new SceneVariableSet({ variables: [dsVariable] }),
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
          body: PanelBuilders.table()
            .setTitle('Custom Resource Definitions')
            .setData(
              withNameLinks(
                new SceneQueryRunner({
                  datasource: {
                    type: 'kranklab-kubernetes-datasource',
                    uid: '${ds}',
                  },
                  queries: [
                    {
                      refId: 'A',
                      action: 'list',
                      resource: 'customresourcedefinitions',
                    },
                  ],
                  maxDataPoints: 100,
                }),
                '${__url.path}/crd/${__value.text}${__url.params}'
              )
            )
            .setOption('sortBy', [{ displayName: 'name', desc: false }])
            .build(),
        }),
      ],
    }),
  });
};

const getCRDsAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.CRDs);

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Custom Resource Definitions',
        subTitle: 'All CRDs registered in the cluster.',
        url: baseUrl,
        hideFromBreadcrumbs: true,
        getScene: getCRDsScene,
        drilldowns: [
          {
            routePath: `${baseUrl}/crd/:name`,
            getPage(routeMatch, parent) {
              const { name } = routeMatch.params;
              return new SceneAppPage({
                title: `CRD: ${name}`,
                url: `${baseUrl}/crd/${name}`,
                getParentPage: () => parent,
                getScene: () => getCRDDetailScene(name),
              });
            },
          },
        ],
      }),
    ],
  });
};

const CRDsPage = () => {
  const scene = useMemo(() => getCRDsAppScene(), []);
  return <scene.Component model={scene} />;
};

export default CRDsPage;
