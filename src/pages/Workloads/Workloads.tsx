import React, { useMemo } from 'react';
import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexLayout,
} from '@grafana/scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { getWorkloadOverviewScene, getWorkloadEventsScene, getWorkloadLogsScene, getWorkloadYamlScene } from '../Home/scenes';
import { makeCardsScene } from '../../components/ResourceCards/makeCardsScene';

type ResourceName = 'pods' | 'deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs';

const RESOURCE_LABELS: Record<ResourceName, string> = {
  pods: 'Pods',
  deployments: 'Deployments',
  replicasets: 'Replica Sets',
  daemonsets: 'Daemon Sets',
  statefulsets: 'Stateful Sets',
  jobs: 'Jobs',
  cronjobs: 'Cron Jobs',
};

function makeDrilldown(baseUrl: string, resource: ResourceName) {
  return {
    routePath: `${baseUrl}/${resource}/:namespace/:name`,
    getPage(routeMatch: any, parent: any): SceneAppPage {
      const { namespace, name } = routeMatch.params;
      const detailUrl = `${baseUrl}/${resource}/${namespace}/${name}`;
      return new SceneAppPage({
        title: `${RESOURCE_LABELS[resource]}: ${name}`,
        subTitle: `Detailed view of ${namespace}/${resource}/${name}`,
        url: `${detailUrl}/overview`,
        getParentPage: () => parent,
        getScene: () =>
          new EmbeddedScene({
            body: new SceneFlexLayout({ children: [] }),
          }),
        tabs: [
          new SceneAppPage({
            title: 'Overview',
            url: `${detailUrl}/overview`,
            getScene: () => getWorkloadOverviewScene(resource, namespace, name),
          }),
          ...(resource === 'pods'
            ? [
                new SceneAppPage({
                  title: 'Logs',
                  url: `${detailUrl}/logs`,
                  getScene: () => getWorkloadLogsScene(namespace, name),
                }),
              ]
            : []),
          new SceneAppPage({
            title: 'YAML',
            url: `${detailUrl}/yaml`,
            getScene: () => getWorkloadYamlScene(resource, namespace, name),
          }),
          new SceneAppPage({
            title: 'Events',
            url: `${detailUrl}/events`,
            getScene: () => getWorkloadEventsScene(namespace, name),
          }),
        ],
      });
    },
  };
}

const getWorkloadsAppScene = () => {
  const baseUrl = prefixRoute(ROUTES.Workloads);
  const resources: ResourceName[] = ['pods', 'deployments', 'replicasets', 'daemonsets', 'statefulsets', 'jobs', 'cronjobs'];

  const drilldowns = resources.map((r) => makeDrilldown(baseUrl, r));

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Workloads',
        subTitle: 'Browse Kubernetes workloads by resource type.',
        url: baseUrl,
        hideFromBreadcrumbs: false,
        getScene: () => makeCardsScene({
          resource: 'pods',
          resourceType: 'pods',
          drilldownUrl: `${baseUrl}/pods/\${namespace}/\${name}/overview`,
        }),
        tabs: resources.map(
          (resource) =>
            new SceneAppPage({
              title: RESOURCE_LABELS[resource],
              url: `${baseUrl}/${resource}`,
              getScene: () => makeCardsScene({
                resource,
                resourceType: resource,
                drilldownUrl: `${baseUrl}/${resource}/\${namespace}/\${name}/overview`,
              }),
            })
        ),
        drilldowns,
      }),
    ],
  });
};

const WorkloadsPage = () => {
  const scene = useMemo(() => getWorkloadsAppScene(), []);
  return <scene.Component model={scene} />;
};

export default WorkloadsPage;
