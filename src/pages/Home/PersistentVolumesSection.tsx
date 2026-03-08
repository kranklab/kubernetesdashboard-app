import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';
import { PLUGIN_BASE_URL } from '../../constants';

interface PVRow {
  name: string;
  capacity: string;
  accessModes: string[];
  reclaimPolicy: string;
  status: string;
  claim: string;
  storageClass: string;
  reason: string;
  created: any;
}

function parseJson(val: any): any {
  if (!val) { return undefined; }
  if (typeof val === 'object') { return val; }
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return undefined; }
  }
  return undefined;
}

function extractPVs(data: any): PVRow[] {
  if (!data?.series?.length) { return []; }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'persistent_volumes');
  if (!frame?.fields?.length) { return []; }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  const rows: PVRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    rows.push({
      name: get('Name') ?? '',
      capacity: get('Capacity') ?? '',
      accessModes: parseJson(get('Access Modes')) ?? [],
      reclaimPolicy: get('Reclaim Policy') ?? '',
      status: get('Status') ?? '',
      claim: get('Claim') ?? '',
      storageClass: get('Storage Class') ?? '',
      reason: get('Reason') ?? '',
      created: get('Created'),
    });
  }
  return rows;
}

function formatAge(ts: any): string {
  if (!ts) { return '-'; }
  try { return dateTime(ts).fromNow(); } catch { return '-'; }
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function PersistentVolumesSectionRenderer({ model }: SceneComponentProps<PersistentVolumesSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'persistent_volumes');
  if (!hasFrame) {
    return null;
  }

  const pvs = extractPVs(data);

  return (
    <CollapsibleSection title="Persistent Volumes">
      {pvs.length === 0 ? (
        <div className={styles.emptyState}>No persistent volumes found.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Capacity</th>
              <th className={styles.th}>Access Modes</th>
              <th className={styles.th}>Reclaim Policy</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Claim</th>
              <th className={styles.th}>Storage Class</th>
              <th className={styles.th}>Reason</th>
              <th className={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {pvs.map((pv, i) => (
              <tr key={i}>
                <td className={styles.td}>
                  <a
                    href={`${PLUGIN_BASE_URL}/cluster/pv/${pv.name}`}
                    style={{ color: 'rgb(110, 159, 255)' }}
                  >
                    {pv.name}
                  </a>
                </td>
                <td className={styles.td}>{pv.capacity}</td>
                <td className={styles.td}>{pv.accessModes.join(', ')}</td>
                <td className={styles.td}>{pv.reclaimPolicy}</td>
                <td className={styles.td}>{pv.status}</td>
                <td className={styles.td}>{pv.claim || '-'}</td>
                <td className={styles.td}>{pv.storageClass}</td>
                <td className={styles.tdMuted}>{pv.reason || '-'}</td>
                <td className={styles.tdMuted}>{formatAge(pv.created)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class PersistentVolumesSection extends SceneObjectBase<SceneObjectState> {
  static Component = PersistentVolumesSectionRenderer;
}
