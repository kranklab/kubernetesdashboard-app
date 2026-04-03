import { DataSourceVariable, QueryVariable } from '@grafana/scenes';

const DS_STORAGE_KEY = 'kranklab-k8s-dashboard-ds';
const NS_STORAGE_KEY = 'kranklab-k8s-dashboard-ns';

/**
 * Creates a DataSourceVariable that persists its selection to localStorage
 * so the chosen cluster carries across page navigations.
 */
export function createDatasourceVariable(): DataSourceVariable {
  const saved = localStorage.getItem(DS_STORAGE_KEY);

  const variable = new DataSourceVariable({
    name: 'ds',
    pluginId: 'kranklab-kubernetes-datasource',
    label: 'Cluster',
    ...(saved ? { value: saved } : {}),
  });

  variable.subscribeToState((newState, oldState) => {
    if (newState.value && newState.value !== oldState.value) {
      localStorage.setItem(DS_STORAGE_KEY, String(newState.value));
    }
  });

  return variable;
}

/**
 * Creates a QueryVariable for namespace that persists its selection to localStorage
 * so the chosen namespace carries across page navigations.
 */
export function createNamespaceVariable(): QueryVariable {
  const saved = localStorage.getItem(NS_STORAGE_KEY);

  const variable = new QueryVariable({
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
    ...(saved ? { value: saved } : {}),
  });

  variable.subscribeToState((newState, oldState) => {
    if (newState.value && newState.value !== oldState.value) {
      localStorage.setItem(NS_STORAGE_KEY, String(newState.value));
    }
  });

  return variable;
}
