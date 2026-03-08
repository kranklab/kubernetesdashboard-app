import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface EndpointRow {
  host: string;
  ports: string;
  node: string;
  ready: boolean;
}

function extractEndpoints(data: any): EndpointRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'endpoints');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const hostF = col('Host');
  const count = hostF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: EndpointRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      host: get('Host') ?? '',
      ports: get('Ports') ?? '',
      node: get('Node') ?? '',
      ready: get('Ready') ?? false,
    });
  }
  return results;
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function EndpointsSectionRenderer({ model }: SceneComponentProps<EndpointsSection>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'endpoints');
  if (!hasFrame) {
    return null;
  }

  const endpoints = extractEndpoints(data);

  return (
    <CollapsibleSection title="Endpoints" defaultCollapsed={endpoints.length === 0}>
      {endpoints.length === 0 ? (
        <div className={styles.emptyState}>
          There is nothing to display here
          <br />
          No resources found.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Host</th>
              <th className={styles.th}>Ports (Name, Port, Protocol)</th>
              <th className={styles.th}>Node</th>
              <th className={styles.th}>Ready</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((ep, i) => (
              <tr key={i}>
                <td className={styles.td}>{ep.host}</td>
                <td className={styles.td}>{ep.ports}</td>
                <td className={styles.td}>{ep.node}</td>
                <td
                  className={styles.td}
                  style={{ color: ep.ready ? theme.colors.success.text : theme.colors.warning.text }}
                >
                  {String(ep.ready)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class EndpointsSection extends SceneObjectBase<SceneObjectState> {
  static Component = EndpointsSectionRenderer;
}
