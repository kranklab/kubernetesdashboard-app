import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
}

function extractVersions(data: any): CRDVersion[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'crd_versions');
  if (!frame || !frame.fields.length) {
    return [];
  }
  const nameF = frame.fields.find((f) => f.name === 'Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const servedF = frame.fields.find((f) => f.name === 'Served');
  const storageF = frame.fields.find((f) => f.name === 'Storage');
  const versions: CRDVersion[] = [];
  for (let i = 0; i < count; i++) {
    versions.push({
      name: (nameF?.values as any)[i] ?? '-',
      served: (servedF?.values as any)?.[i] ?? false,
      storage: (storageF?.values as any)?.[i] ?? false,
    });
  }
  return versions;
}

function CRDVersionsSectionRenderer({ model }: SceneComponentProps<CRDVersionsSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const versions = extractVersions(data);

  if (versions.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Versions">
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Served</th>
            <th className={styles.th}>Storage</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v, i) => (
            <tr key={i}>
              <td className={styles.td}>{v.name}</td>
              <td className={styles.td}>{v.served ? 'true' : 'false'}</td>
              <td className={styles.td}>{v.storage ? 'true' : 'false'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleSection>
  );
}

export class CRDVersionsSection extends SceneObjectBase<SceneObjectState> {
  static Component = CRDVersionsSectionRenderer;
}
