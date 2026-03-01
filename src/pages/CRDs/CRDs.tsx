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

const TABLE_HEIGHT = 500;

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
              })
            )
            .setOption('sortBy', [{ displayName: 'name', desc: false }])
            .build(),
        }),
      ],
    }),
  });
};

const getCRDsAppScene = () => {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Custom Resource Definitions',
        subTitle: 'All CRDs registered in the cluster.',
        url: prefixRoute(ROUTES.CRDs),
        hideFromBreadcrumbs: true,
        getScene: getCRDsScene,
      }),
    ],
  });
};

const CRDsPage = () => {
  const scene = useMemo(() => getCRDsAppScene(), []);
  return <scene.Component model={scene} />;
};

export default CRDsPage;