import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneVariableSet,
} from '@grafana/scenes';
import { createDatasourceVariable } from '../../utils/utils.datasource';
import { MetadataHeader } from '../Home/MetadataHeader';
import { ResourceInfoSection } from '../Home/ResourceInfoSection';
import { ConditionsSection } from '../Home/ConditionsSection';
import { RBACRulesSection } from '../Home/RBACRulesSection';
import { SubjectsSection } from '../Home/SubjectsSection';
import { ServiceAccountSection } from '../Home/ServiceAccountSection';
import { NodeSystemInfoSection } from '../Home/NodeSystemInfoSection';
import { PodsSection } from '../Home/PodsSection';
import { PVSourceSection } from '../Home/PVSourceSection';

function makeClusterVariable() {
  return new SceneVariableSet({
    variables: [createDatasourceVariable()],
  });
}

function makeDetailScene(resource: string, name: string, namespace: string | null, ...sections: any[]) {
  const queries: any[] = [{ refId: 'A', action: 'get', resource, name }];
  if (namespace) {
    queries[0].namespace = namespace;
  }
  return new EmbeddedScene({
    $variables: makeClusterVariable(),
    $data: new SceneQueryRunner({
      datasource: { type: 'kranklab-kubernetes-datasource', uid: '${ds}' },
      queries,
      maxDataPoints: 100,
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        ...sections.map((s) => new SceneFlexItem({ ySizing: 'content', body: s })),
      ],
    }),
    controls: [new SceneControlsSpacer(), new SceneRefreshPicker({})],
  });
}

export function getClusterRoleBindingDetailScene(name: string) {
  return makeDetailScene('clusterrolebindings', name, null, new ResourceInfoSection({}), new SubjectsSection({}));
}

export function getClusterRoleDetailScene(name: string) {
  return makeDetailScene('clusterroles', name, null, new RBACRulesSection({}));
}

export function getEventDetailScene(name: string) {
  return makeDetailScene('events', name, null);
}

export function getNamespaceDetailScene(name: string) {
  return makeDetailScene('namespaces', name, null, new ResourceInfoSection({}));
}

export function getNetworkPolicyDetailScene(namespace: string, name: string) {
  return makeDetailScene('networkpolicies', name, namespace, new ResourceInfoSection({}));
}

export function getNodeDetailScene(name: string) {
  return makeDetailScene('nodes', name, null, new ResourceInfoSection({}), new NodeSystemInfoSection({}), new ConditionsSection({}), new PodsSection({}));
}

export function getPersistentVolumeDetailScene(name: string) {
  return makeDetailScene('persistentvolumes', name, null, new ResourceInfoSection({}), new PVSourceSection({}));
}

export function getRoleBindingDetailScene(namespace: string, name: string) {
  return makeDetailScene('rolebindings', name, namespace, new ResourceInfoSection({}), new SubjectsSection({}));
}

export function getRoleDetailScene(namespace: string, name: string) {
  return makeDetailScene('roles', name, namespace, new RBACRulesSection({}));
}

export function getServiceAccountDetailScene(namespace: string, name: string) {
  return makeDetailScene('serviceaccounts', name, namespace, new ServiceAccountSection({}));
}
