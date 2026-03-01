import {
  PanelBuilders,
  SceneQueryRunner,
} from '@grafana/scenes';

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

export function makeDetailQueryRunner(resource: string, name: string): SceneQueryRunner {
  return new SceneQueryRunner({
    datasource: {
      type: 'kranklab-kubernetes-datasource',
      uid: '${ds}',
    },
    queries: [
      {
        refId: 'A',
        action: 'get',
        namespace: '${namespace}',
        resource,
        name,
      },
    ],
    maxDataPoints: 100,
  });
}

export function getServicesTable() {
  return PanelBuilders.table()
    .setTitle('Services')
    .setData(makeQueryRunner('services'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Service',
          url: '${__url.path}/service/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}

export function getIngressesTable() {
  return PanelBuilders.table()
    .setTitle('Ingresses')
    .setData(makeQueryRunner('ingresses'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Ingress',
          url: '${__url.path}/ingress/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}

export function getIngressClassesTable() {
  return PanelBuilders.table()
    .setTitle('Ingress Classes')
    .setData(makeQueryRunner('ingressclasses'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Ingress Class',
          url: '${__url.path}/ingressclass/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}
