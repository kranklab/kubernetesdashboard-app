import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Workloads = 'workloads',
  Networking = 'networking',
  ConfigStorage = 'config-storage',
  Cluster = 'cluster',
  CRDs = 'crds',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};
