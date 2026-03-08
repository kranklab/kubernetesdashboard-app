import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface HPA {
  name: string;
  namespace: string;
  minPods: number;
  maxPods: number;
  currentReplicas: number;
  desiredReplicas: number;
}

function extractHPAs(data: any): HPA[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'hpas');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: HPA[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      minPods: get('Min Pods') ?? 0,
      maxPods: get('Max Pods') ?? 0,
      currentReplicas: get('Current Replicas') ?? 0,
      desiredReplicas: get('Desired Replicas') ?? 0,
    });
  }
  return results;
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function HPARenderer({ model }: SceneComponentProps<HPASection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'hpas');
  if (!hasFrame) {
    return null;
  }

  const hpas = extractHPAs(data);

  return (
    <CollapsibleSection title="Horizontal Pod Autoscalers" defaultCollapsed={hpas.length === 0}>
      {hpas.length === 0 ? (
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
              <th className={styles.th}>Min Pods</th>
              <th className={styles.th}>Max Pods</th>
              <th className={styles.th}>Current</th>
              <th className={styles.th}>Desired</th>
            </tr>
          </thead>
          <tbody>
            {hpas.map((hpa, i) => (
              <tr key={i}>
                <td className={styles.td}>{hpa.name}</td>
                <td className={styles.td}>{hpa.namespace}</td>
                <td className={styles.td}>{hpa.minPods}</td>
                <td className={styles.td}>{hpa.maxPods}</td>
                <td className={styles.td}>{hpa.currentReplicas}</td>
                <td className={styles.td}>{hpa.desiredReplicas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class HPASection extends SceneObjectBase<SceneObjectState> {
  static Component = HPARenderer;
}
