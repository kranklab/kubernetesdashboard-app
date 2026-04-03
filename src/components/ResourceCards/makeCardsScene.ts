import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { createDatasourceVariable, createNamespaceVariable } from '../../utils/utils.datasource';
import { ResourceCards } from './ResourceCards';

export function makeCardsScene(opts: {
  resource: string;
  resourceType: string;
  drilldownUrl: string;
  namespaced?: boolean;
}) {
  const { resource, resourceType, drilldownUrl, namespaced = true } = opts;

  const variables = namespaced
    ? [createDatasourceVariable(), createNamespaceVariable()]
    : [createDatasourceVariable()];

  const query: any = { refId: 'A', action: 'list', resource };
  if (namespaced) {
    query.namespace = '${namespace}';
  }

  return new EmbeddedScene({
    $variables: new SceneVariableSet({ variables }),
    $data: new SceneQueryRunner({
      datasource: { type: 'kranklab-kubernetes-datasource', uid: '${ds}' },
      queries: [query],
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
          body: new ResourceCards({ resourceType, drilldownUrl }),
        }),
      ],
    }),
  });
}
