import {
  DataSourceVariable,
  EmbeddedScene,
  PanelBuilders,
  QueryVariable,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { makeDetailQueryRunner } from './panels';
import { MetadataHeader } from '../Home/MetadataHeader';

function makeVariables() {
  return new SceneVariableSet({
    variables: [
      new DataSourceVariable({
        name: 'ds',
        pluginId: 'kranklab-kubernetes-datasource',
        label: 'Cluster',
      }),
      new QueryVariable({
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
      }),
    ],
  });
}

function makeDetailScene(title: string, resource: string, name: string) {
  return new EmbeddedScene({
    $variables: makeVariables(),
    $data: makeDetailQueryRunner(resource, name),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({
          ySizing: 'fill',
          body: PanelBuilders.table()
            .setTitle(title)
            .setDisplayMode('transparent')
            .build(),
        }),
      ],
    }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getConfigMapDetailScene(name: string) {
  return makeDetailScene(`Config Map: ${name}`, 'configmaps', name);
}

export function getPVCDetailScene(name: string) {
  return makeDetailScene(`Persistent Volume Claim: ${name}`, 'persistentvolumeclaims', name);
}

export function getSecretDetailScene(name: string) {
  return makeDetailScene(`Secret: ${name}`, 'secrets', name);
}

export function getStorageClassDetailScene(name: string) {
  return makeDetailScene(`Storage Class: ${name}`, 'storageclasses', name);
}
