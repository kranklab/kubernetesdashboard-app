import {
  PanelBuilders,
  SceneQueryRunner,
} from '@grafana/scenes';
import { withNameLinks } from '../../utils/utils.links';

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

export function makeDetailQueryRunner(resource: string, namespace: string, name: string): SceneQueryRunner {
  return new SceneQueryRunner({
    datasource: {
      type: 'kranklab-kubernetes-datasource',
      uid: '${ds}',
    },
    queries: [
      {
        refId: 'A',
        action: 'get',
        namespace,
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
    .setData(
      withNameLinks(
        makeQueryRunner('services'),
        '${__url.path}/service/${__data.fields["Namespace"]}/${__value.text}${__url.params}'
      )
    )
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getIngressesTable() {
  return PanelBuilders.table()
    .setTitle('Ingresses')
    .setData(
      withNameLinks(
        makeQueryRunner('ingresses'),
        '${__url.path}/ingress/${__data.fields["Namespace"]}/${__value.text}${__url.params}'
      )
    )
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getIngressClassesTable() {
  return PanelBuilders.table()
    .setTitle('Ingress Classes')
    .setData(withNameLinks(makeQueryRunner('ingressclasses'), '${__url.path}/ingressclass/${__value.text}${__url.params}'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}
