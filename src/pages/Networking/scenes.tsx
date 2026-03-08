import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneVariableSet,
  DataSourceVariable,
} from '@grafana/scenes';
import { makeDetailQueryRunner } from './panels';
import { MetadataHeader } from '../Home/MetadataHeader';
import { ResourceInfoSection } from '../Home/ResourceInfoSection';
import { ConditionsSection } from '../Home/ConditionsSection';
import { EventsSection } from '../Home/EventsSection';
import { EndpointsSection } from '../Home/EndpointsSection';
import { PodsSection } from '../Home/PodsSection';
import { IngressesListSection } from '../Home/IngressesListSection';
import { RulesSection } from '../Home/RulesSection';

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

export function getServiceOverviewScene(namespace: string, name: string) {
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: makeDetailQueryRunner('services', namespace, name),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ResourceInfoSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new EndpointsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new PodsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new IngressesListSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new EventsSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getIngressOverviewScene(namespace: string, name: string) {
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: makeDetailQueryRunner('ingresses', namespace, name),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ResourceInfoSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new RulesSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new EventsSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getIngressClassOverviewScene(name: string) {
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: makeDetailQueryRunner('ingressclasses', '', name),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ResourceInfoSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ConditionsSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}
