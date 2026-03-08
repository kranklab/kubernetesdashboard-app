import {
  DataSourceVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneVariableSet,
} from '@grafana/scenes';
import { MetadataHeader } from '../Home/MetadataHeader';
import { ResourceInfoSection } from '../Home/ResourceInfoSection';
import { DataSection } from '../Home/DataSection';
import { SecretDataSection } from '../Home/SecretDataSection';
import { PersistentVolumesSection } from '../Home/PersistentVolumesSection';

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


export function getConfigMapDetailScene(namespace: string, name: string) {
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
          namespace,
          resource: 'configmaps',
          name,
        },
      ],
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new DataSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getPVCDetailScene(namespace: string, name: string) {
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
          namespace,
          resource: 'persistentvolumeclaims',
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
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getSecretDetailScene(namespace: string, name: string) {
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
          namespace,
          resource: 'secrets',
          name,
        },
      ],
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new SecretDataSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getStorageClassDetailScene(name: string) {
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
          resource: 'storageclasses',
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
        new SceneFlexItem({ ySizing: 'content', body: new PersistentVolumesSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}
