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

export function getServicesTable(baseUrl: string) {
  return PanelBuilders.table()
    .setTitle('Services')
    .setData(
      withNameLinks(
        makeQueryRunner('services'),
        `${baseUrl}/service/\${__data.fields["Namespace"]}/\${__value.text}\${__url.params}`
      )
    )
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getIngressesTable(baseUrl: string) {
  return PanelBuilders.table()
    .setTitle('Ingresses')
    .setData(
      withNameLinks(
        makeQueryRunner('ingresses'),
        `${baseUrl}/ingress/\${__data.fields["Namespace"]}/\${__value.text}\${__url.params}`
      )
    )
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getIngressClassesTable(baseUrl: string) {
  return PanelBuilders.table()
    .setTitle('Ingress Classes')
    .setData(withNameLinks(makeQueryRunner('ingressclasses'), `${baseUrl}/ingressclass/\${__value.text}\${__url.params}`))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}
