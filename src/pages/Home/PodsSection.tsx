import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles, labelColor } from './CollapsibleSection';
import { PLUGIN_BASE_URL, ROUTES } from '../../constants';

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

interface PodRow {
  name: string;
  namespace: string;
  images: string[];
  labels: Record<string, string>;
  node: string;
  status: string;
  restarts: number;
  created: any;
}

function extractPods(data: any): PodRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'pods');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: PodRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      images: parseJson(get('Images')) ?? [],
      labels: parseJson(get('Labels')) ?? {},
      node: get('Node') ?? '',
      status: get('Status') ?? '',
      restarts: get('Restarts') ?? 0,
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

function podStatusColor(status: string, theme: GrafanaTheme2): string {
  switch (status.toLowerCase()) {
    case 'running':
      return theme.colors.success.text;
    case 'succeeded':
      return theme.colors.text.secondary;
    case 'failed':
      return theme.colors.error.text;
    case 'pending':
      return theme.colors.warning.text;
    default:
      return theme.colors.text.primary;
  }
}

function PodsSectionRenderer({ model }: SceneComponentProps<PodsSection>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'pods');
  if (!hasFrame) {
    return null;
  }

  const pods = extractPods(data);

  return (
    <CollapsibleSection title="Pods" defaultCollapsed={pods.length === 0}>
      {pods.length === 0 ? (
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
              <th className={styles.th}>Images</th>
              <th className={styles.th}>Labels</th>
              <th className={styles.th}>Node</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Restarts</th>
              <th className={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod, i) => (
              <tr key={i}>
                <td className={styles.td}>
                  <a
                    href={`${PLUGIN_BASE_URL}/${ROUTES.Workloads}/pods/${pod.namespace}/${pod.name}/overview`}
                    className={styles.link}
                  >
                    {pod.name}
                  </a>
                </td>
                <td className={styles.td}>
                  <div className={styles.chipsRow}>
                    {pod.images.map((img, j) => (
                      <span key={j} className={styles.mutedChip}>
                        {img}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.chipsRow}>
                    {Object.entries(pod.labels).map(([k, v], j) => (
                      <span key={k} className={styles.chip} style={{ backgroundColor: labelColor(j) }}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={styles.td}>{pod.node}</td>
                <td className={styles.td} style={{ color: podStatusColor(pod.status, theme) }}>
                  {pod.status}
                </td>
                <td className={styles.td}>{pod.restarts}</td>
                <td className={styles.td}>{formatAge(pod.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class PodsSection extends SceneObjectBase<SceneObjectState> {
  static Component = PodsSectionRenderer;
}
