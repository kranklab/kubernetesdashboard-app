import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles, labelColor } from './CollapsibleSection';

function parseJson(val: any): any {
  if (!val) {
    return undefined;
  }
  if (typeof val === 'object') {
    return val;
  }
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

interface IngressRow {
  name: string;
  namespace: string;
  labels: Record<string, string>;
  endpoints: string[];
  hosts: string[];
  created: any;
}

function extractIngresses(data: any): IngressRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'ingresses');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: IngressRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      labels: parseJson(get('Labels')) ?? {},
      endpoints: parseJson(get('Endpoints')) ?? [],
      hosts: parseJson(get('Hosts')) ?? [],
      created: get('Created'),
    });
  }
  return results;
}

function formatAge(ts: any): string {
  if (!ts) {
    return '-';
  }
  try {
    return dateTime(ts).fromNow();
  } catch {
    return '-';
  }
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function IngressesListSectionRenderer({ model }: SceneComponentProps<IngressesListSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'ingresses');
  if (!hasFrame) {
    return null;
  }

  const ingresses = extractIngresses(data);

  return (
    <CollapsibleSection title="Ingresses" defaultCollapsed={ingresses.length === 0}>
      {ingresses.length === 0 ? (
        <div className={styles.emptyState}>
          There is nothing to display here
          <br />
          No resources found.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Namespace</th>
              <th className={styles.th}>Labels</th>
              <th className={styles.th}>Endpoints</th>
              <th className={styles.th}>Hosts</th>
              <th className={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {ingresses.map((ing, i) => (
              <tr key={i}>
                <td className={styles.td}>{ing.name}</td>
                <td className={styles.td}>{ing.namespace}</td>
                <td className={styles.td}>
                  <div className={styles.chipsRow}>
                    {Object.entries(ing.labels).map(([k, v], j) => (
                      <span key={k} className={styles.chip} style={{ backgroundColor: labelColor(j) }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>
                  {ing.endpoints.map((ep, j) => (
                    <div key={j}>{ep}</div>
                  ))}
                </td>
                <td className={styles.td}>
                  {ing.hosts.map((h, j) => (
                    <div key={j}>{h}</div>
                  ))}
                </td>
                <td className={styles.td}>{formatAge(ing.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class IngressesListSection extends SceneObjectBase<SceneObjectState> {
  static Component = IngressesListSectionRenderer;
}
