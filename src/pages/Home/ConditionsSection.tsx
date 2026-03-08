import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface Condition {
  type: string;
  status: string;
  lastProbeTime?: number | null;
  lastTransitionTime?: number | null;
  reason: string;
  message: string;
}

function extractConditions(data: any): Condition[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find(
    (f: DataFrame) => f.name === 'conditions'
  );
  if (!frame || !frame.fields.length) {
    return [];
  }

  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const typeF = col('Type');
  const count = typeF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }

  const statusF = col('Status');
  const lastProbeF = col('Last Probe Time');
  const lastTransF = col('Last Transition Time');
  const reasonF = col('Reason');
  const messageF = col('Message');

  const conditions: Condition[] = [];
  for (let i = 0; i < count; i++) {
    conditions.push({
      type: (typeF?.values as any)[i] ?? '-',
      status: (statusF?.values as any)[i] ?? '-',
      lastProbeTime: (lastProbeF?.values as any)?.[i] ?? null,
      lastTransitionTime: (lastTransF?.values as any)?.[i] ?? null,
      reason: (reasonF?.values as any)[i] ?? '',
      message: (messageF?.values as any)[i] ?? '',
    });
  }
  return conditions;
}

function formatTime(ts: number | null | undefined): string {
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

function ConditionsRenderer({ model }: SceneComponentProps<ConditionsSection>) {
  const styles = useStyles2(getStyles);

  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();
  const conditions = extractConditions(data);

  if (conditions.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Conditions">
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Last probe time</th>
            <th className={styles.th}>Last transition time</th>
            <th className={styles.th}>Reason</th>
            <th className={styles.th}>Message</th>
          </tr>
        </thead>
        <tbody>
          {conditions.map((c, i) => (
            <tr key={i}>
              <td className={styles.td}>{c.type}</td>
              <td className={styles.td}>
                <span
                  className={
                    c.status === 'True'
                      ? styles.statusTrue
                      : c.status === 'False'
                      ? styles.statusFalse
                      : undefined
                  }
                >
                  {c.status}
                </span>
              </td>
              <td className={styles.tdMuted}>{formatTime(c.lastProbeTime)}</td>
              <td className={styles.tdMuted}>{formatTime(c.lastTransitionTime)}</td>
              <td className={styles.td}>{c.reason || '-'}</td>
              <td className={styles.td}>{c.message || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleSection>
  );
}

export class ConditionsSection extends SceneObjectBase<SceneObjectState> {
  static Component = ConditionsRenderer;
}
