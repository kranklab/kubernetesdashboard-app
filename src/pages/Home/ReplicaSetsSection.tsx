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

interface ReplicaSet {
  name: string;
  namespace: string;
  created?: any;
  isNew: boolean;
  replicas: number;
  ready: number;
  labels?: Record<string, string>;
  images?: string[];
}

function extractReplicaSets(data: any): ReplicaSet[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'replicasets');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: ReplicaSet[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      created: get('Created'),
      isNew: get('Is New') ?? false,
      replicas: get('Replicas') ?? 0,
      ready: get('Ready') ?? 0,
      labels: parseJson(get('Labels')),
      images: parseJson(get('Images')),
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

function ReplicaSetCard({
  rs,
  styles,
}: {
  rs: ReplicaSet;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <>
      <div className={styles.fieldsRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <span className={styles.fieldValue}>{rs.name}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Namespace</span>
          <span className={styles.fieldValue}>{rs.namespace}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Age</span>
          <span className={styles.fieldValue}>{formatAge(rs.created)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Pods</span>
          <span className={styles.fieldValue}>
            {rs.ready} / {rs.replicas}
          </span>
        </div>
      </div>
      {rs.labels && Object.keys(rs.labels).length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div className={styles.sectionLabel}>Labels</div>
          <div className={styles.chipsRow}>
            {Object.entries(rs.labels).map(([key, value], i) => (
              <span
                key={key}
                className={styles.chip}
                style={{ backgroundColor: labelColor(i) }}
                title={`${key}: ${value}`}
              >
                {key}: {value}
              </span>
            ))}
          </div>
        </div>
      )}
      {rs.images && rs.images.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Images</div>
          <div className={styles.chipsRow}>
            {rs.images.map((img, i) => (
              <span key={i} className={styles.mutedChip}>
                {img}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ReplicaSetsRenderer({ model }: SceneComponentProps<ReplicaSetsSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'replicasets');
  if (!hasFrame) {
    return null;
  }

  const all = extractReplicaSets(data);
  const newRS = all.filter((rs) => rs.isNew);
  const oldRSes = all.filter((rs) => !rs.isNew);

  return (
    <>
      <CollapsibleSection title="New Replica Set">
        {newRS.length === 0 ? (
          <div className={styles.emptyState}>
            There is nothing to display here
            <br />
            No resources found.
          </div>
        ) : (
          newRS.map((rs) => <ReplicaSetCard key={rs.name} rs={rs} styles={styles} />)
        )}
      </CollapsibleSection>
      <CollapsibleSection title="Old Replica Sets" defaultCollapsed={oldRSes.length === 0}>
        {oldRSes.length === 0 ? (
          <div className={styles.emptyState}>
            There is nothing to display here
            <br />
            No resources found.
          </div>
        ) : (
          oldRSes.map((rs) => <ReplicaSetCard key={rs.name} rs={rs} styles={styles} />)
        )}
      </CollapsibleSection>
    </>
  );
}

export class ReplicaSetsSection extends SceneObjectBase<SceneObjectState> {
  static Component = ReplicaSetsRenderer;
}
