import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function getNamesFrame(data: any): DataFrame | undefined {
  if (!data?.series?.length) {
    return undefined;
  }
  return data.series.find((f: DataFrame) => f.name === 'crd_names');
}

function CRDNamesSectionRenderer({ model }: SceneComponentProps<CRDNamesSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const frame = getNamesFrame(data);
  if (!frame) {
    return null;
  }

  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const get = (name: string) => (col(name)?.values as any)?.[0];

  const plural = get('Plural');
  const singular = get('Singular');
  const kind = get('Kind');
  const listKind = get('List Kind');
  const shortNames = get('Short Names');

  const fields = [
    { label: 'Plural', value: plural },
    { label: 'Singular', value: singular },
    { label: 'Kind', value: kind },
    { label: 'List Kind', value: listKind },
    { label: 'Short Names', value: shortNames },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  if (fields.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Accepted Names">
      <div className={styles.fieldsRow}>
        {fields.map(({ label, value }) => (
          <div key={label} className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <span className={styles.fieldValue}>{String(value)}</span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export class CRDNamesSection extends SceneObjectBase<SceneObjectState> {
  static Component = CRDNamesSectionRenderer;
}
