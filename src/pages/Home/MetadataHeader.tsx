import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { css } from '@emotion/css';
import { CollapsibleSection, getSectionStyles, labelColor } from './CollapsibleSection';

export function getFieldValue(frame: DataFrame, ...fieldNames: string[]): any {
  for (const name of fieldNames) {
    const field = frame.fields.find(
      (f) => f.name === name || f.name.toLowerCase() === name.toLowerCase()
    );
    if (field && field.values.length > 0) {
      const val = (field.values as any)[0];
      if (val !== undefined && val !== null) {
        return val;
      }
    }
  }
  return undefined;
}

export function parseJsonOrObject(value: any): Record<string, string> | undefined {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // not valid JSON
    }
  }
  return undefined;
}

export function parseJsonArray(value: any): any[] | undefined {
  if (!value) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // not valid JSON
    }
  }
  return undefined;
}

function buildOwner(kind?: string, name?: string): string | undefined {
  if (!kind && !name) {
    return undefined;
  }
  return `${(kind ?? 'owner').toLowerCase()}/${name ?? ''}`;
}

export function getMetaFrame(data: any): DataFrame | undefined {
  if (!data?.series?.length) {
    return undefined;
  }
  return (
    data.series.find((f: DataFrame) => f.name === 'meta') ?? data.series[0]
  );
}

interface MetadataInfo {
  name?: string;
  namespace?: string;
  created?: string | number;
  uid?: string;
  owner?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

function extractMetadata(data: any): MetadataInfo {
  const frame = getMetaFrame(data);
  if (!frame) {
    return {};
  }

  return {
    name: getFieldValue(frame, 'name'),
    namespace: getFieldValue(frame, 'namespace'),
    uid: getFieldValue(frame, 'uid'),
    created: getFieldValue(frame, 'created'),
    owner: buildOwner(
      getFieldValue(frame, 'Owner Kind'),
      getFieldValue(frame, 'Owner Name')
    ),
    labels: parseJsonOrObject(getFieldValue(frame, 'labels')),
    annotations: parseJsonOrObject(getFieldValue(frame, 'annotations')),
  };
}

function formatCreated(ts: string | number | undefined): string {
  if (!ts) {
    return '-';
  }
  try {
    return dateTime(ts).format('MMM D, YYYY');
  } catch {
    return String(ts);
  }
}

function formatAge(ts: string | number | undefined): string {
  if (!ts) {
    return '-';
  }
  try {
    return dateTime(ts).fromNow();
  } catch {
    return '-';
  }
}

const SOURCE_ANNOTATION = 'app.kubernetes.io/source-url';

function getOpenTraceUrl(sourceUrl: string): string | null {
  if (!sourceUrl.match(/(?:github|gitlab)\.com\//)) {
    return null;
  }
  return `https://oss.opentrace.ai/?repo=${encodeURIComponent(sourceUrl)}`;
}

function getStyles(theme: GrafanaTheme2) {
  const base = getSectionStyles(theme);
  return {
    ...base,
    buttonsRow: css`
      display: flex;
      gap: ${theme.spacing(1)};
      margin-top: ${theme.spacing(1)};
    `,
    sourceButton: css`
      display: inline-flex;
      align-items: center;
      padding: ${theme.spacing(0.5, 1.5)};
      border-radius: ${theme.shape.radius.default};
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      background: ${theme.colors.success.transparent};
      border: 1px solid ${theme.colors.success.border};
      color: ${theme.colors.success.text};
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
      &:hover {
        background: ${theme.colors.success.main};
        color: ${theme.colors.success.contrastText};
      }
    `,
    opentraceButton: css`
      display: inline-flex;
      align-items: center;
      padding: ${theme.spacing(0.5, 1.5)};
      border-radius: ${theme.shape.radius.default};
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      background: ${theme.colors.info.transparent};
      border: 1px solid ${theme.colors.info.border};
      color: ${theme.colors.info.text};
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
      &:hover {
        background: ${theme.colors.info.main};
        color: ${theme.colors.info.contrastText};
      }
    `,
  };
}

function MetadataHeaderRenderer({ model }: SceneComponentProps<MetadataHeader>) {
  const styles = useStyles2(getStyles);

  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();
  const meta = extractMetadata(data);

  return (
    <CollapsibleSection title="Metadata">
      <div className={styles.fieldsRow}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <span className={styles.fieldValue}>{meta.name ?? '-'}</span>
        </div>
        {meta.namespace !== undefined && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Namespace</span>
            <span className={styles.fieldValue}>{meta.namespace}</span>
          </div>
        )}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Created</span>
          <span className={styles.fieldValue}>{formatCreated(meta.created)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Age</span>
          <span className={styles.fieldValue}>{formatAge(meta.created)}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>UID</span>
          <span className={styles.fieldValue}>{meta.uid ?? '-'}</span>
        </div>
        {meta.owner && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Owner</span>
            <span className={styles.fieldValue}>{meta.owner}</span>
          </div>
        )}
      </div>

      {meta.labels && Object.keys(meta.labels).length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Labels</div>
          <div className={styles.chipsRow}>
            {Object.entries(meta.labels).map(([key, value], i) => (
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

      {meta.annotations && Object.keys(meta.annotations).length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div className={styles.sectionLabel}>Annotations</div>
          <div className={styles.chipsRow}>
            {Object.entries(meta.annotations).map(([key, value]) => {
              const display = String(value);
              const truncated = display.length > 60 ? display.substring(0, 60) + '…' : display;
              return (
                <span key={key} className={styles.mutedChip} title={`${key}: ${display}`}>
                  {key}: {truncated}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {meta.annotations?.[SOURCE_ANNOTATION] && (() => {
        const sourceUrl = meta.annotations[SOURCE_ANNOTATION];
        const opentraceUrl = getOpenTraceUrl(sourceUrl);
        return (
          <div className={styles.buttonsRow}>
            <a className={styles.sourceButton} href={sourceUrl} target="_blank" rel="noopener noreferrer">
              Source
            </a>
            {opentraceUrl && (
              <a className={styles.opentraceButton} href={opentraceUrl} target="_blank" rel="noopener noreferrer">
                OpenTrace
              </a>
            )}
          </div>
        );
      })()}
    </CollapsibleSection>
  );
}

export class MetadataHeader extends SceneObjectBase<SceneObjectState> {
  static Component = MetadataHeaderRenderer;
}

