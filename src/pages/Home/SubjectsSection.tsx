import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';
import { PLUGIN_BASE_URL } from '../../constants';

interface Subject {
  name: string;
  namespace: string;
  kind: string;
  apiGroup: string;
}

function extractSubjects(data: any): Subject[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'subjects');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const count = col('Name')?.values.length ?? 0;
  const rows: Subject[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i] ?? '';
    rows.push({
      name: get('Name'),
      namespace: get('Namespace'),
      kind: get('Kind'),
      apiGroup: get('API Group'),
    });
  }
  return rows;
}

function getSubjectLink(subject: Subject): string | undefined {
  if (subject.kind === 'ServiceAccount' && subject.namespace) {
    return `${PLUGIN_BASE_URL}/cluster/serviceaccount/${subject.namespace}/${subject.name}`;
  }
  return undefined;
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function SubjectsSectionRenderer({ model }: SceneComponentProps<SubjectsSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'subjects');
  if (!hasFrame) {
    return null;
  }
  const subjects = extractSubjects(data);
  return (
    <CollapsibleSection title="Subjects">
      {subjects.length === 0 ? (
        <div className={styles.emptyState}>No subjects found.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Namespace</th>
              <th className={styles.th}>Kind</th>
              <th className={styles.th}>API Group</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => {
              const link = getSubjectLink(s);
              return (
                <tr key={i}>
                  <td className={styles.td}>
                    {link ? (
                      <a href={link} style={{ color: 'rgb(110, 159, 255)' }}>{s.name}</a>
                    ) : (
                      s.name
                    )}
                  </td>
                  <td className={styles.td}>{s.namespace || '-'}</td>
                  <td className={styles.td}>{s.kind}</td>
                  <td className={styles.td}>{s.apiGroup || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class SubjectsSection extends SceneObjectBase<SceneObjectState> {
  static Component = SubjectsSectionRenderer;
}
