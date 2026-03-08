import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

interface CapRow {
  name: string;
  quantity: string;
}

function PVSourceSectionRenderer({ model }: SceneComponentProps<PVSourceSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasSource = data?.series?.some((f: DataFrame) => f.name === 'pv_source');
  const hasCapacity = data?.series?.some((f: DataFrame) => f.name === 'pv_capacity');
  if (!hasSource && !hasCapacity) {
    return null;
  }

  const sourceFrame: DataFrame | undefined = data?.series.find((f: DataFrame) => f.name === 'pv_source');
  const capacityFrame: DataFrame | undefined = data?.series.find((f: DataFrame) => f.name === 'pv_capacity');

  const sourceFields =
    sourceFrame?.fields
      .filter((f) => (f.values as any)[0] !== undefined && (f.values as any)[0] !== '')
      .map((f) => ({ label: f.name, value: String((f.values as any)[0]) })) ?? [];

  const capacityRows: CapRow[] = [];
  if (capacityFrame) {
    const nameF = capacityFrame.fields.find((f) => f.name === 'Resource Name');
    const quantityF = capacityFrame.fields.find((f) => f.name === 'Quantity');
    const count = nameF?.values.length ?? 0;
    for (let i = 0; i < count; i++) {
      capacityRows.push({
        name: (nameF?.values as any)[i] ?? '',
        quantity: (quantityF?.values as any)[i] ?? '',
      });
    }
  }

  return (
    <>
      {sourceFields.length > 0 && (
        <CollapsibleSection title="Source">
          <div className={styles.fieldsRow}>
            {sourceFields.map(({ label, value }) => (
              <div key={label} className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldValue}>{value}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
      {capacityRows.length > 0 && (
        <CollapsibleSection title="Capacity">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Resource name</th>
                <th className={styles.th}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {capacityRows.map((row, i) => (
                <tr key={i}>
                  <td className={styles.td}>{row.name}</td>
                  <td className={styles.td}>{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      )}
    </>
  );
}

export class PVSourceSection extends SceneObjectBase<SceneObjectState> {
  static Component = PVSourceSectionRenderer;
}
