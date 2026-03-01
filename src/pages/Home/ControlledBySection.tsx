import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles, labelColor } from './CollapsibleSection';
import { getFieldValue, parseJsonOrObject, getMetaFrame } from './MetadataHeader';

interface ControlledByInfo {
  ownerKind?: string;
  ownerName?: string;
  created?: number;
  labels?: Record<string, string>;
}

function extractControlledBy(data: any): ControlledByInfo {
  const frame = getMetaFrame(data);
  if (!frame) {
    return {};
  }

  return {
    ownerKind: getFieldValue(frame, 'ownerKind'),
    ownerName: getFieldValue(frame, 'ownerName'),
    created: getFieldValue(frame, 'created'),
    labels: parseJsonOrObject(getFieldValue(frame, 'labels')),
  };
}

function formatAge(ts: number | undefined): string {
  if (!ts) {
    return '-';
  }
  try {
    return dateTime(ts).fromNow();
  } catch {
    return '-';
  }
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function ControlledByRenderer({ model }: SceneComponentProps<ControlledBySection>) {
  const styles = useStyles2(getStyles);

  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();
  const info = extractControlledBy(data);

  if (!info.ownerKind && !info.ownerName) {
    return null;
  }

  return (
    <CollapsibleSection title="Controlled by">
      <div className={styles.fieldsRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <span className={styles.fieldValue}>{info.ownerName ?? '-'}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Kind</span>
          <span className={styles.fieldValue}>{info.ownerKind ?? '-'}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Age</span>
          <span className={styles.fieldValue}>{formatAge(info.created)}</span>
        </div>
      </div>

      {info.labels && Object.keys(info.labels).length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Labels</div>
          <div className={styles.chipsRow}>
            {Object.entries(info.labels).map(([key, value], i) => (
              <span
                key={key}
                className={styles.chip}
                style={{ backgroundColor: labelColor(i) }}
                title={`${key}: ${value}`}
              >
                {key}: {value}
              </span>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

export class ControlledBySection extends SceneObjectBase<SceneObjectState> {
  static Component = ControlledByRenderer;
}
