import React, { useMemo } from 'react';
import {
  SceneApp,
  SceneAppPage,
} from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { makeCardsScene } from '../../components/ResourceCards/makeCardsScene';
import {
  getClusterRoleBindingDetailScene,
  getClusterRoleDetailScene,
  getEventDetailScene,
  getNamespaceDetailScene,
  getNetworkPolicyDetailScene,
  getNodeDetailScene,
  getPersistentVolumeDetailScene,
  getRoleBindingDetailScene,
  getRoleDetailScene,
  getServiceAccountDetailScene,
} from './scenes';
import { getWorkloadYamlScene } from '../Home/scenes';

const getClusterAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.Cluster);

  const drilldowns = [
    {
      routePath: `${baseUrl}/clusterrolebinding/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Cluster Role Binding: ${name}`,
          url: `${baseUrl}/clusterrolebinding/${name}`,
          getParentPage: () => parent,
          getScene: () => getClusterRoleBindingDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/clusterrolebinding/${name}/overview`, getScene: () => getClusterRoleBindingDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/clusterrolebinding/${name}/yaml`, getScene: () => getWorkloadYamlScene('clusterrolebindings', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/clusterrole/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Cluster Role: ${name}`,
          url: `${baseUrl}/clusterrole/${name}`,
          getParentPage: () => parent,
          getScene: () => getClusterRoleDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/clusterrole/${name}/overview`, getScene: () => getClusterRoleDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/clusterrole/${name}/yaml`, getScene: () => getWorkloadYamlScene('clusterroles', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/event/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Event: ${name}`,
          url: `${baseUrl}/event/${name}`,
          getParentPage: () => parent,
          getScene: () => getEventDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/event/${name}/overview`, getScene: () => getEventDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/event/${name}/yaml`, getScene: () => getWorkloadYamlScene('events', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Namespace: ${name}`,
          url: `${baseUrl}/namespace/${name}`,
          getParentPage: () => parent,
          getScene: () => getNamespaceDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/namespace/${name}/overview`, getScene: () => getNamespaceDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/namespace/${name}/yaml`, getScene: () => getWorkloadYamlScene('namespaces', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/networkpolicy/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Network Policy: ${name}`,
          url: `${baseUrl}/networkpolicy/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getNetworkPolicyDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/networkpolicy/${namespace}/${name}/overview`, getScene: () => getNetworkPolicyDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/networkpolicy/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('networkpolicies', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/node/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Node: ${name}`,
          url: `${baseUrl}/node/${name}`,
          getParentPage: () => parent,
          getScene: () => getNodeDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/node/${name}/overview`, getScene: () => getNodeDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/node/${name}/yaml`, getScene: () => getWorkloadYamlScene('nodes', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/pv/:name`,
      getPage(routeMatch: any, parent: any) {
        const { name } = routeMatch.params;
        return new SceneAppPage({
          title: `Persistent Volume: ${name}`,
          url: `${baseUrl}/pv/${name}`,
          getParentPage: () => parent,
          getScene: () => getPersistentVolumeDetailScene(name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/pv/${name}/overview`, getScene: () => getPersistentVolumeDetailScene(name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/pv/${name}/yaml`, getScene: () => getWorkloadYamlScene('persistentvolumes', null, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/rolebinding/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Role Binding: ${name}`,
          url: `${baseUrl}/rolebinding/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getRoleBindingDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/rolebinding/${namespace}/${name}/overview`, getScene: () => getRoleBindingDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/rolebinding/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('rolebindings', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/role/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Role: ${name}`,
          url: `${baseUrl}/role/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getRoleDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/role/${namespace}/${name}/overview`, getScene: () => getRoleDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/role/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('roles', namespace, name) }),
          ],
        });
      },
    },
    {
      routePath: `${baseUrl}/serviceaccount/:namespace/:name`,
      getPage(routeMatch: any, parent: any) {
        const { namespace, name } = routeMatch.params;
        return new SceneAppPage({
          title: `Service Account: ${name}`,
          url: `${baseUrl}/serviceaccount/${namespace}/${name}`,
          getParentPage: () => parent,
          getScene: () => getServiceAccountDetailScene(namespace, name),
          tabs: [
            new SceneAppPage({ title: 'Overview', url: `${baseUrl}/serviceaccount/${namespace}/${name}/overview`, getScene: () => getServiceAccountDetailScene(namespace, name) }),
            new SceneAppPage({ title: 'YAML', url: `${baseUrl}/serviceaccount/${namespace}/${name}/yaml`, getScene: () => getWorkloadYamlScene('serviceaccounts', namespace, name) }),
          ],
        });
      },
    },
  ];

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Cluster',
        subTitle: 'Cluster-wide resources including roles, nodes, namespaces, and policies.',
        url: baseUrl,
        hideFromBreadcrumbs: false,
        getScene: () => makeCardsScene({
          resource: 'clusterrolebindings',
          resourceType: 'clusterrolebindings',
          drilldownUrl: `${baseUrl}/clusterrolebinding/\${name}`,
          namespaced: false,
        }),
        tabs: [
          new SceneAppPage({
            title: 'Cluster Role Bindings',
            url: `${baseUrl}/clusterrolebindings`,
            getScene: () => makeCardsScene({ resource: 'clusterrolebindings', resourceType: 'clusterrolebindings', drilldownUrl: `${baseUrl}/clusterrolebinding/\${name}`, namespaced: false }),
          }),
          new SceneAppPage({
            title: 'Cluster Roles',
            url: `${baseUrl}/clusterroles`,
            getScene: () => makeCardsScene({ resource: 'clusterroles', resourceType: 'clusterroles', drilldownUrl: `${baseUrl}/clusterrole/\${name}`, namespaced: false }),
          }),
          new SceneAppPage({
            title: 'Events',
            url: `${baseUrl}/events`,
            getScene: () => makeCardsScene({ resource: 'events', resourceType: 'events', drilldownUrl: `${baseUrl}/event/\${name}`, namespaced: false }),
          }),
          new SceneAppPage({
            title: 'Namespaces',
            url: `${baseUrl}/namespaces`,
            getScene: () => makeCardsScene({ resource: 'namespaces', resourceType: 'namespaces', drilldownUrl: `${baseUrl}/namespace/\${name}`, namespaced: false }),
          }),
          new SceneAppPage({
            title: 'Network Policies',
            url: `${baseUrl}/networkpolicies`,
            getScene: () => makeCardsScene({ resource: 'networkpolicies', resourceType: 'networkpolicies', drilldownUrl: `${baseUrl}/networkpolicy/\${namespace}/\${name}` }),
          }),
          new SceneAppPage({
            title: 'Nodes',
            url: `${baseUrl}/nodes`,
            getScene: () => makeCardsScene({ resource: 'nodes', resourceType: 'nodes', drilldownUrl: `${baseUrl}/node/\${name}`, namespaced: false }),
          }),
          new SceneAppPage({
            title: 'Persistent Volumes',
            url: `${baseUrl}/persistentvolumes`,
            getScene: () => makeCardsScene({ resource: 'persistentvolumes', resourceType: 'persistentvolumes', drilldownUrl: `${baseUrl}/pv/\${name}`, namespaced: false }),
          }),
          new SceneAppPage({
            title: 'Role Bindings',
            url: `${baseUrl}/rolebindings`,
            getScene: () => makeCardsScene({ resource: 'rolebindings', resourceType: 'rolebindings', drilldownUrl: `${baseUrl}/rolebinding/\${namespace}/\${name}` }),
          }),
          new SceneAppPage({
            title: 'Roles',
            url: `${baseUrl}/roles`,
            getScene: () => makeCardsScene({ resource: 'roles', resourceType: 'roles', drilldownUrl: `${baseUrl}/role/\${namespace}/\${name}` }),
          }),
          new SceneAppPage({
            title: 'Service Accounts',
            url: `${baseUrl}/serviceaccounts`,
            getScene: () => makeCardsScene({ resource: 'serviceaccounts', resourceType: 'serviceaccounts', drilldownUrl: `${baseUrl}/serviceaccount/\${namespace}/\${name}` }),
          }),
        ],
        drilldowns,
      }),
    ],
  });
};

const ClusterPage = () => {
  const scene = useMemo(() => getClusterAppScene(), []);
  return <scene.Component model={scene} />;
};

export default ClusterPage;
