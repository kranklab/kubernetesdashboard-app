import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

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

interface ServiceRow {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: Array<{ name: string; port: number; protocol: string; nodePort?: number }>;
}

function extractServices(data: any): ServiceRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'services');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: ServiceRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      type: get('Type') ?? '',
      clusterIP: get('Cluster IP') ?? '',
      ports: parseJson(get('Ports')) ?? [],
    });
  }
  return results;
}

function formatPorts(ports: ServiceRow['ports']): string {
  return ports
    .map((p) => {
      let s = `${p.port}/${p.protocol}`;
      if (p.nodePort) {
        s += `:${p.nodePort}`;
      }
      return s;
    })
    .join(', ');
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function ServicesSectionRenderer({ model }: SceneComponentProps<ServicesSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'services');
  if (!hasFrame) {
    return null;
  }

  const services = extractServices(data);

  return (
    <CollapsibleSection title="Services" defaultCollapsed={services.length === 0}>
      {services.length === 0 ? (
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
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Cluster IP</th>
              <th className={styles.th}>Ports</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc, i) => (
              <tr key={i}>
                <td className={styles.td}>{svc.name}</td>
                <td className={styles.td}>{svc.type}</td>
                <td className={styles.td}>{svc.clusterIP}</td>
                <td className={styles.td}>{formatPorts(svc.ports)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class ServicesSection extends SceneObjectBase<SceneObjectState> {
  static Component = ServicesSectionRenderer;
}
