import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function NodeSystemInfoRenderer({ model }: SceneComponentProps<NodeSystemInfoSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'node_info');
  if (!hasFrame) {
    return null;
  }
  const frame: DataFrame | undefined = data?.series.find((f: DataFrame) => f.name === 'node_info');
  if (!frame) {
    return null;
  }
  const fields = frame.fields
    .filter((f) => (f.values as any)[0] !== undefined && (f.values as any)[0] !== '')
    .map((f) => ({ label: f.name, value: String((f.values as any)[0]) }));
  if (fields.length === 0) {
    return null;
  }
  return (
    <CollapsibleSection title="System information">
      <div className={styles.fieldsRow}>
        {fields.map(({ label, value }) => (
          <div key={label} className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <span className={styles.fieldValue}>{value}</span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export class NodeSystemInfoSection extends SceneObjectBase<SceneObjectState> {
  static Component = NodeSystemInfoRenderer;
}
