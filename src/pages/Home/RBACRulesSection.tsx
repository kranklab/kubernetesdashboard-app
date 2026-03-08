import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface RBACRule {
  resources: string;
  nonResourceURLs: string;
  resourceNames: string;
  verbs: string;
  apiGroups: string;
}

function extractRules(data: any): RBACRule[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'rbac_rules');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const count = col('Resources')?.values.length ?? 0;
  const rows: RBACRule[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i] ?? '';
    rows.push({
      resources: get('Resources'),
      nonResourceURLs: get('Non-resource URLs'),
      resourceNames: get('Resource Names'),
      verbs: get('Verbs'),
      apiGroups: get('API Groups'),
    });
  }
  return rows;
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function RBACRulesSectionRenderer({ model }: SceneComponentProps<RBACRulesSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'rbac_rules');
  if (!hasFrame) {
    return null;
  }
  const rules = extractRules(data);
  return (
    <CollapsibleSection title="Rules">
      {rules.length === 0 ? (
        <div className={styles.emptyState}>No rules found.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Resources</th>
              <th className={styles.th}>Non-resource URL</th>
              <th className={styles.th}>Resource Names</th>
              <th className={styles.th}>Verbs</th>
              <th className={styles.th}>API Groups</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, i) => (
              <tr key={i}>
                <td className={styles.td}>{rule.resources}</td>
                <td className={styles.td}>{rule.nonResourceURLs}</td>
                <td className={styles.td}>{rule.resourceNames}</td>
                <td className={styles.td}>{rule.verbs}</td>
                <td className={styles.td}>{rule.apiGroups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class RBACRulesSection extends SceneObjectBase<SceneObjectState> {
  static Component = RBACRulesSectionRenderer;
}
