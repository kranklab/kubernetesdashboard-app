import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';
import { getFieldValue, parseJsonArray, getMetaFrame } from './MetadataHeader';

interface ResourceInfo {
  node?: string;
  status?: string;
  ip?: string;
  qosClass?: string;
  restarts?: string | number;
  serviceAccount?: string;
  imagePullSecrets?: string[];
}

function extractResourceInfo(data: any): ResourceInfo {
  const frame = getMetaFrame(data);
  if (!frame) {
    return {};
  }

  const imagePullSecretsRaw = getFieldValue(
    frame,
    'imagePullSecrets',
    'spec.imagePullSecrets'
  );
  let imagePullSecrets: string[] | undefined;
  const parsed = parseJsonArray(imagePullSecretsRaw);
  if (parsed) {
    imagePullSecrets = parsed.map((s: any) =>
      typeof s === 'string' ? s : s?.name ?? JSON.stringify(s)
    );
  } else if (typeof imagePullSecretsRaw === 'string' && imagePullSecretsRaw.length > 0) {
    imagePullSecrets = [imagePullSecretsRaw];
  }

  return {
    node: getFieldValue(frame, 'nodeName', 'spec.nodeName', 'node'),
    status: getFieldValue(frame, 'phase', 'status.phase', 'status'),
    ip: getFieldValue(frame, 'podIP', 'status.podIP', 'ip', 'hostIP'),
    qosClass: getFieldValue(frame, 'qosClass', 'status.qosClass'),
    restarts: getFieldValue(frame, 'restartCount', 'restarts', 'restartCount'),
    serviceAccount: getFieldValue(
      frame,
      'serviceAccountName',
      'spec.serviceAccountName',
      'serviceAccount'
    ),
    imagePullSecrets,
  };
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function ResourceInfoRenderer({ model }: SceneComponentProps<ResourceInfoSection>) {
  const styles = useStyles2(getStyles);

  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();
  const info = extractResourceInfo(data);

  const fields: Array<{ label: string; value?: string | number }> = [
    { label: 'Node', value: info.node },
    { label: 'Status', value: info.status },
    { label: 'IP', value: info.ip },
    { label: 'QoS Class', value: info.qosClass },
    { label: 'Restarts', value: info.restarts },
    { label: 'Service Account', value: info.serviceAccount },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  if (
    fields.length === 0 &&
    (!info.imagePullSecrets || info.imagePullSecrets.length === 0)
  ) {
    return null;
  }

  return (
    <CollapsibleSection title="Resource information">
      <div className={styles.fieldsRow}>
        {fields.map(({ label, value }) => (
          <div key={label} className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <span className={styles.fieldValue}>{String(value)}</span>
          </div>
        ))}
      </div>

      {info.imagePullSecrets && info.imagePullSecrets.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Image Pull Secrets</div>
          <div className={styles.chipsRow}>
            {info.imagePullSecrets.map((s) => (
              <span key={s} className={styles.mutedChip}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

export class ResourceInfoSection extends SceneObjectBase<SceneObjectState> {
  static Component = ResourceInfoRenderer;
}

