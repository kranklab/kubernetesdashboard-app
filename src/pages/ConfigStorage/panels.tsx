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

export function getConfigMapsTable() {
  return PanelBuilders.table()
    .setTitle('Config Maps')
    .setData(withNameLinks(makeQueryRunner('configmaps'), '${__url.path}/configmap/${__data.fields["Namespace"]}/${__value.text}${__url.params}'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getPersistentVolumeClaimsTable() {
  return PanelBuilders.table()
    .setTitle('Persistent Volume Claims')
    .setData(withNameLinks(makeQueryRunner('persistentvolumeclaims'), '${__url.path}/pvc/${__data.fields["Namespace"]}/${__value.text}${__url.params}'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getSecretsTable() {
  return PanelBuilders.table()
    .setTitle('Secrets')
    .setData(withNameLinks(makeQueryRunner('secrets'), '${__url.path}/secret/${__data.fields["Namespace"]}/${__value.text}${__url.params}'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}

export function getStorageClassesTable() {
  return PanelBuilders.table()
    .setTitle('Storage Classes')
    .setData(withNameLinks(makeQueryRunner('storageclasses'), '${__url.path}/storageclass/${__value.text}${__url.params}'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .build();
}
