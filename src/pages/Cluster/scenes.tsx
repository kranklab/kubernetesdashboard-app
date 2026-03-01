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

export function getClusterRoleBindingDetailScene(name: string) {
  return makeDetailScene(`Cluster Role Binding: ${name}`, 'clusterrolebindings', name);
}

export function getClusterRoleDetailScene(name: string) {
  return makeDetailScene(`Cluster Role: ${name}`, 'clusterroles', name);
}

export function getEventDetailScene(name: string) {
  return makeDetailScene(`Event: ${name}`, 'events', name);
}

export function getNamespaceDetailScene(name: string) {
  return makeDetailScene(`Namespace: ${name}`, 'namespaces', name);
}

export function getNetworkPolicyDetailScene(name: string) {
  return makeDetailScene(`Network Policy: ${name}`, 'networkpolicies', name);
}

export function getNodeDetailScene(name: string) {
  return makeDetailScene(`Node: ${name}`, 'nodes', name);
}

export function getPersistentVolumeDetailScene(name: string) {
  return makeDetailScene(`Persistent Volume: ${name}`, 'persistentvolumes', name);
}

export function getRoleBindingDetailScene(name: string) {
  return makeDetailScene(`Role Binding: ${name}`, 'rolebindings', name);
}

export function getRoleDetailScene(name: string) {
  return makeDetailScene(`Role: ${name}`, 'roles', name);
}

export function getServiceAccountDetailScene(name: string) {
  return makeDetailScene(`Service Account: ${name}`, 'serviceaccounts', name);
}
