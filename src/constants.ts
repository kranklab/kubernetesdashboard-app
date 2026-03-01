import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Networking = 'networking',
  ConfigStorage = 'config-storage',
  Cluster = 'cluster',
  CRDs = 'crds',
  WithTabs = 'page-with-tabs',
  WithDrilldown = 'page-with-drilldown',
  HelloWorld = 'hello-world',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};
