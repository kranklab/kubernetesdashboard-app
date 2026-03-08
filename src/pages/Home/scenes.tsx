import {
  CustomVariable,
  DataSourceVariable,
  EmbeddedScene,
  PanelBuilders,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DATASOURCE_REF } from '../../constants';
import { CustomSceneObject } from './CustomSceneObject';
import { MetadataHeader } from './MetadataHeader';
import { ResourceInfoSection } from './ResourceInfoSection';
import { ConditionsSection } from './ConditionsSection';
import { ControlledBySection } from './ControlledBySection';
import { EventsSection } from './EventsSection';
import { ContainersSection } from './ContainersSection';
import { ReplicaSetsSection } from './ReplicaSetsSection';
import { HPASection } from './HPASection';
import { PodsSection } from './PodsSection';
import { ServicesSection } from './ServicesSection';
import { JobsSection } from './JobsSection';
import { EndpointsSection } from './EndpointsSection';
import { RulesSection } from './RulesSection';
import { IngressesListSection } from './IngressesListSection';

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

export function getWorkloadOverviewScene(type: string, namespace: string, name: string) {
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
          resource: type,
          namespace,
          name,
        },
      ],
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({ ySizing: 'content', body: new MetadataHeader({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ResourceInfoSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ContainersSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ConditionsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ControlledBySection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ReplicaSetsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new HPASection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new PodsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new ServicesSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new EndpointsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new RulesSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new IngressesListSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new JobsSection({}) }),
        new SceneFlexItem({ ySizing: 'content', body: new EventsSection({}) }),
      ],
    }),
    controls: [
      new SceneControlsSpacer(),
      new SceneRefreshPicker({}),
    ],
  });
}

export function getWorkloadEventsScene(namespace: string, name: string) {
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
          action: 'list',
          resource: 'events',
          namespace,
          name,
        },
      ],
    }),
    body: new SceneFlexLayout({
      direction: 'column',
      children: [
        new SceneFlexItem({
          ySizing: 'fill',
          body: PanelBuilders.table()
            .setTitle('Events')
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

export function getBasicScene(templatised = true, seriesToShow = '__server_names') {
  const timeRange = new SceneTimeRange({
    from: 'now-6h',
    to: 'now',
  });

  // Variable definition, using Grafana built-in TestData datasource
  const customVariable = new CustomVariable({
    name: 'seriesToShow',
    label: 'Series to show',
    value: '__server_names',
    query: 'Server Names : __server_names, House locations : __house_locations',
  });

  // Query runner definition, using Grafana built-in TestData datasource
  const queryRunner = new SceneQueryRunner({
    datasource: DATASOURCE_REF,
    queries: [
      {
        refId: 'A',
        datasource: DATASOURCE_REF,
        scenarioId: 'random_walk',
        seriesCount: 5,
        // Query is using variable value
        alias: templatised ? '${seriesToShow}' : seriesToShow,
        min: 30,
        max: 60,
      },
    ],
    maxDataPoints: 100,
  });

  // Custom object definition
  const customObject = new CustomSceneObject({
    counter: 5,
  });

  // Query runner activation handler that will update query runner state when custom object state changes
  queryRunner.addActivationHandler(() => {
    const sub = customObject.subscribeToState((newState) => {
      queryRunner.setState({
        queries: [
          {
            ...queryRunner.state.queries[0],
            seriesCount: newState.counter,
          },
        ],
      });
      queryRunner.runQueries();
    });

    return () => {
      sub.unsubscribe();
    };
  });

  return new EmbeddedScene({
    $timeRange: timeRange,
    $variables: new SceneVariableSet({ variables: templatised ? [customVariable] : [] }),
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          minHeight: 300,
          body: PanelBuilders.timeseries()
            // Title is using variable value
            .setTitle(templatised ? '${seriesToShow}' : seriesToShow)
            .build(),
        }),
      ],
    }),
    controls: [
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      customObject,
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({
        intervals: ['5s', '1m', '1h'],
        isOnCanvas: true,
      }),
    ],
  });
}
