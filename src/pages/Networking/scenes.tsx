import {
  EmbeddedScene,
  PanelBuilders,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneVariableSet,
  DataSourceVariable,
  QueryVariable,
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

export function getServiceOverviewScene(name: string) {
  return makeDetailScene(`Service: ${name}`, 'services', name);
}

export function getServiceEndpointsScene(name: string) {
  return makeDetailScene(`Endpoints: ${name}`, 'endpoints', name);
}

export function getIngressOverviewScene(name: string) {
  return makeDetailScene(`Ingress: ${name}`, 'ingresses', name);
}

export function getIngressRulesScene(name: string) {
  return makeDetailScene(`Rules: ${name}`, 'ingressrules', name);
}

export function getIngressClassOverviewScene(name: string) {
  return makeDetailScene(`Ingress Class: ${name}`, 'ingressclasses', name);
}
