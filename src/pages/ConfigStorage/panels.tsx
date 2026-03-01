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

export function getConfigMapsTable() {
  return PanelBuilders.table()
    .setTitle('Config Maps')
    .setData(makeQueryRunner('configmaps'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Config Map',
          url: '${__url.path}/configmap/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}

export function getPersistentVolumeClaimsTable() {
  return PanelBuilders.table()
    .setTitle('Persistent Volume Claims')
    .setData(makeQueryRunner('persistentvolumeclaims'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Persistent Volume Claim',
          url: '${__url.path}/pvc/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}

export function getSecretsTable() {
  return PanelBuilders.table()
    .setTitle('Secrets')
    .setData(makeQueryRunner('secrets'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Secret',
          url: '${__url.path}/secret/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}

export function getStorageClassesTable() {
  return PanelBuilders.table()
    .setTitle('Storage Classes')
    .setData(makeQueryRunner('storageclasses'))
    .setOption('sortBy', [{ displayName: 'name', desc: false }])
    .setOverrides((b) => {
      b.matchFieldsWithName('name').overrideLinks([
        {
          title: 'View Storage Class',
          url: '${__url.path}/storageclass/${__value.text}${__url.params}',
        },
      ]);
    })
    .build();
}