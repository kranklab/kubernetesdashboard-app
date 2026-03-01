import React, { useMemo } from 'react';

import {
    DataSourceVariable,
    EmbeddedScene,
    PanelBuilders,
    SceneApp,
    SceneAppPage,
    SceneFlexLayout,
    SceneGridItem,
    SceneGridLayout,
    SceneGridRow,
    SceneQueryRunner,
    SceneVariableSet,
    QueryVariable,
    VariableValueSelectors,
    SceneRefreshPicker,
} from '@grafana/scenes';
import {
    BigValueColorMode,
    BigValueGraphMode,
    BigValueTextMode,
    MappingType,
    TableCellDisplayMode,
} from '@grafana/schema';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { getWorkloadOverviewScene, getWorkloadEventsScene } from './scenes';

type ResourceName = 'pods' | 'deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs';

const RESOURCES: ResourceName[] = [
    'pods',
    'deployments',
    'replicasets',
    'daemonsets',
    'statefulsets',
    'jobs',
    'cronjobs',
];

const RESOURCE_LABELS: Record<ResourceName, string> = {
    pods: 'Pods',
    deployments: 'Deployments',
    replicasets: 'Replica Sets',
    daemonsets: 'Daemon Sets',
    statefulsets: 'Stateful Sets',
    jobs: 'Jobs',
    cronjobs: 'Cron Jobs',
};

const RESOURCE_COLORS: Record<ResourceName, string> = {
    pods: 'blue',
    deployments: 'green',
    replicasets: 'purple',
    daemonsets: 'orange',
    statefulsets: 'yellow',
    jobs: 'red',
    cronjobs: 'dark-red',
};

const POD_STATUS_MAPPINGS = [
    {
        type: MappingType.ValueToText as const,
        options: {
            Running: { color: 'green', text: 'Running', index: 0 },
            Pending: { color: 'yellow', text: 'Pending', index: 1 },
            Succeeded: { color: 'blue', text: 'Succeeded', index: 2 },
            Failed: { color: 'red', text: 'Failed', index: 3 },
            Unknown: { color: 'orange', text: 'Unknown', index: 4 },
            Terminating: { color: 'orange', text: 'Terminating', index: 5 },
            CrashLoopBackOff: { color: 'red', text: 'CrashLoopBackOff', index: 6 },
        },
    },
];

const DEPLOYMENT_STATUS_MAPPINGS = [
    {
        type: MappingType.ValueToText as const,
        options: {
            Available: { color: 'green', text: 'Available', index: 0 },
            Progressing: { color: 'yellow', text: 'Progressing', index: 1 },
            ReplicaFailure: { color: 'red', text: 'ReplicaFailure', index: 2 },
        },
    },
];

function makeQueryRunner(resource: string): SceneQueryRunner {
    return new SceneQueryRunner({
        datasource: {
            type: 'kranklab-kubernetes-datasource',
            uid: '${ds}',
        },
        queries: [
            {
                refId: 'A',
                action: 'list',
                namespace: '${namespace}',
                resource,
            },
        ],
        maxDataPoints: 100,
    });
}

const getHomeScene = () => {
    const dsVariable = new DataSourceVariable({
        name: 'ds',
        pluginId: 'kranklab-kubernetes-datasource',
        label: 'Cluster',
    });

    const namespaceVariable = new QueryVariable({
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
    });

    // Each resource gets two runners: one for the stat card, one for the table
    const statRunners: Record<string, SceneQueryRunner> = {};
    const tableRunners: Record<string, SceneQueryRunner> = {};

    RESOURCES.forEach((name) => {
        statRunners[name] = makeQueryRunner(name);
        tableRunners[name] = makeQueryRunner(name);
    });

    // ── Grid dimensions ──────────────────────────────────────────────────────
    const STAT_H = 4;
    const TABLE_H = 10;
    const FULL_W = 24;
    const HALF_W = 12;

    // 7 resources across 24 columns: first 6 get width 3, last gets width 6
    const statWidths = RESOURCES.map((_, i) => (i < RESOURCES.length - 1 ? 3 : FULL_W - 3 * (RESOURCES.length - 1)));

    // ── Stat overview row ────────────────────────────────────────────────────
    const statItems = RESOURCES.map((name, i) => {
        const xOffset = statWidths.slice(0, i).reduce((a, b) => a + b, 0);
        return new SceneGridItem({
            x: xOffset,
            y: 0,
            width: statWidths[i],
            height: STAT_H,
            body: PanelBuilders.stat()
                .setTitle(RESOURCE_LABELS[name])
                .setData(statRunners[name])
                .setOption('reduceOptions', {
                    values: false,
                    calcs: ['count'],
                    fields: '',
                })
                .setOption('graphMode', BigValueGraphMode.None)
                .setOption('colorMode', BigValueColorMode.Background)
                .setOption('textMode', BigValueTextMode.Auto)
                .setOverrides((b) => {
                    b.matchFieldsByQuery('A').overrideColor({
                        mode: 'fixed',
                        fixedColor: RESOURCE_COLORS[name],
                    });
                })
                .build(),
        });
    });

    // ── Pods row (full width) ─────────────────────────────────────────────────
    const podsRowY = STAT_H;
    const podsRow = new SceneGridRow({
        title: 'Pods',
        y: podsRowY,
        children: [
            new SceneGridItem({
                x: 0,
                y: podsRowY + 1,
                width: FULL_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Pods')
                    .setData(tableRunners['pods'])
                    .setOption('sortBy', [{ displayName: 'name', desc: false }])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View Pod',
                                url: `\${__url.path}/workload/pods/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                        b.matchFieldsWithName('status').overrideMappings(POD_STATUS_MAPPINGS);
                        b.matchFieldsWithName('status').overrideCustomFieldConfig(
                            'displayMode',
                            TableCellDisplayMode.ColorText
                        );
                    })
                    .build(),
            }),
        ],
    });

    // ── Workloads row: Deployments + ReplicaSets ─────────────────────────────
    const workloadsRowY = podsRowY + 1 + TABLE_H + 1;
    const workloadsRow = new SceneGridRow({
        title: 'Workloads',
        y: workloadsRowY,
        children: [
            new SceneGridItem({
                x: 0,
                y: workloadsRowY + 1,
                width: HALF_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Deployments')
                    .setData(tableRunners['deployments'])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View Deployment',
                                url: `\${__url.path}/workload/deployments/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                        b.matchFieldsWithName('status').overrideMappings(DEPLOYMENT_STATUS_MAPPINGS);
                        b.matchFieldsWithName('status').overrideCustomFieldConfig(
                            'displayMode',
                            TableCellDisplayMode.ColorText
                        );
                    })
                    .build(),
            }),
            new SceneGridItem({
                x: HALF_W,
                y: workloadsRowY + 1,
                width: HALF_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Replica Sets')
                    .setData(tableRunners['replicasets'])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View ReplicaSet',
                                url: `\${__url.path}/workload/replicasets/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                    })
                    .build(),
            }),
        ],
    });

    // ── Controllers row: DaemonSets + StatefulSets ───────────────────────────
    const controllersRowY = workloadsRowY + 1 + TABLE_H + 1;
    const controllersRow = new SceneGridRow({
        title: 'Controllers',
        y: controllersRowY,
        children: [
            new SceneGridItem({
                x: 0,
                y: controllersRowY + 1,
                width: HALF_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Daemon Sets')
                    .setData(tableRunners['daemonsets'])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View DaemonSet',
                                url: `\${__url.path}/workload/daemonsets/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                    })
                    .build(),
            }),
            new SceneGridItem({
                x: HALF_W,
                y: controllersRowY + 1,
                width: HALF_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Stateful Sets')
                    .setData(tableRunners['statefulsets'])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View StatefulSet',
                                url: `\${__url.path}/workload/statefulsets/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                    })
                    .build(),
            }),
        ],
    });

    // ── Batch row: Jobs + CronJobs ───────────────────────────────────────────
    const batchRowY = controllersRowY + 1 + TABLE_H + 1;
    const batchRow = new SceneGridRow({
        title: 'Batch',
        y: batchRowY,
        children: [
            new SceneGridItem({
                x: 0,
                y: batchRowY + 1,
                width: HALF_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Jobs')
                    .setData(tableRunners['jobs'])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View Job',
                                url: `\${__url.path}/workload/jobs/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                    })
                    .build(),
            }),
            new SceneGridItem({
                x: HALF_W,
                y: batchRowY + 1,
                width: HALF_W,
                height: TABLE_H,
                body: PanelBuilders.table()
                    .setTitle('Cron Jobs')
                    .setData(tableRunners['cronjobs'])
                    .setOverrides((b) => {
                        b.matchFieldsWithName('name').overrideLinks([
                            {
                                title: 'View CronJob',
                                url: `\${__url.path}/workload/cronjobs/\${__data.fields["namespace"]}/\${__value.text}/overview`,
                            },
                        ]);
                    })
                    .build(),
            }),
        ],
    });

    return new EmbeddedScene({
        $variables: new SceneVariableSet({ variables: [dsVariable, namespaceVariable] }),
        controls: [new VariableValueSelectors({}), new SceneRefreshPicker({ intervals: ['30s', '1m', '5m', '15m'] })],
        body: new SceneGridLayout({
            children: [
                ...statItems,
                podsRow,
                workloadsRow,
                controllersRow,
                batchRow,
            ],
        }),
    });
};

const getScene = () => {
    return new SceneApp({
        pages: [
            new SceneAppPage({
                title: 'Cluster Overview',
                subTitle: 'Kubernetes workload status and resource counts across your cluster.',
                url: prefixRoute(ROUTES.Home),
                getScene: () => getHomeScene(),
                drilldowns: [
                    {
                        routePath: prefixRoute(ROUTES.Home) + '/workload/:type/:namespace/:name',
                        getPage(routeMatch, parent): SceneAppPage {
                            const { type, namespace, name } = routeMatch.params;
                            const baseUrl = prefixRoute(ROUTES.Home) + `/workload/${type}/${namespace}/${name}`;
                            return new SceneAppPage({
                                title: `${RESOURCE_LABELS[type as ResourceName] ?? type}: ${name}`,
                                subTitle: `Detailed view of ${namespace}/${type}/${name}`,
                                url: `${baseUrl}/overview`,
                                getParentPage: () => parent,
                                getScene: () =>
                                    new EmbeddedScene({
                                        body: new SceneFlexLayout({ children: [] }),
                                    }),
                                tabs: [
                                    new SceneAppPage({
                                        title: 'Overview',
                                        url: `${baseUrl}/overview`,
                                        getScene: () => getWorkloadOverviewScene(type, namespace, name),
                                    }),
                                    new SceneAppPage({
                                        title: 'Events',
                                        url: `${baseUrl}/events`,
                                        getScene: () => getWorkloadEventsScene(namespace, name),
                                    }),
                                ],
                            });
                        },
                    },
                ],
            }),
        ],
    });
};

const HomePage = () => {
    const scene = useMemo(() => getScene(), []);
    return <scene.Component model={scene} />;
};

export default HomePage;
