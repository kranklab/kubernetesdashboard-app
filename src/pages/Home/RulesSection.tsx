import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface RuleRow {
  host: string;
  path: string;
  pathType: string;
  serviceName: string;
  servicePort: number;
  tlsSecret: string;
}

function extractRules(data: any): RuleRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'rules');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const hostF = col('Host');
  const count = hostF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: RuleRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      host: get('Host') ?? '',
      path: get('Path') ?? '',
      pathType: get('Path Type') ?? '',
      serviceName: get('Service Name') ?? '',
      servicePort: get('Service Port') ?? 0,
      tlsSecret: get('TLS Secret') ?? '',
    });
  }
  return results;
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function RulesSectionRenderer({ model }: SceneComponentProps<RulesSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'rules');
  if (!hasFrame) {
    return null;
  }

  const rules = extractRules(data);

  return (
    <CollapsibleSection title="Rules" defaultCollapsed={rules.length === 0}>
      {rules.length === 0 ? (
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
              <th className={styles.th}>Path</th>
              <th className={styles.th}>Path Type</th>
              <th className={styles.th}>Service Name</th>
              <th className={styles.th}>Service Port</th>
              <th className={styles.th}>TLS Secret</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={i}>
                <td className={styles.td}>{rule.host}</td>
                <td className={styles.td}>{rule.path}</td>
                <td className={styles.td}>{rule.pathType}</td>
                <td className={styles.td}>{rule.serviceName}</td>
                <td className={styles.td}>{rule.servicePort > 0 ? rule.servicePort : '-'}</td>
                <td className={styles.td}>{rule.tlsSecret || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class RulesSection extends SceneObjectBase<SceneObjectState> {
  static Component = RulesSectionRenderer;
}
