import React, { useState } from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface SecretEntry {
  key: string;
  value: string;
  size: number;
}

function extractSecrets(data: any): SecretEntry[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'secret_data');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const keyF = col('Key');
  const count = keyF?.values.length ?? 0;
  const entries: SecretEntry[] = [];
  for (let i = 0; i < count; i++) {
    entries.push({
      key: (keyF?.values as any)[i] ?? '',
      value: (col('Value')?.values as any)?.[i] ?? '',
      size: (col('Size')?.values as any)?.[i] ?? 0,
    });
  }
  return entries;
}

function getStyles(theme: GrafanaTheme2) {
  const base = getSectionStyles(theme);
  return {
    ...base,
    secretRow: css`
      display: flex;
      align-items: center;
      padding: ${theme.spacing(0.5, 0)};
      border-bottom: 1px solid ${theme.colors.border.weak};
      gap: ${theme.spacing(1)};
      &:last-child {
        border-bottom: none;
      }
    `,
    secretKey: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.primary};
      font-family: ${theme.typography.fontFamilyMonospace};
      min-width: 120px;
    `,
    secretSize: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    secretValue: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      font-family: ${theme.typography.fontFamilyMonospace};
      word-break: break-all;
      flex: 1;
    `,
    eyeBtn: css`
      background: none;
      border: none;
      cursor: pointer;
      color: ${theme.colors.text.secondary};
      padding: 2px 4px;
      border-radius: ${theme.shape.radius.default};
      font-size: 14px;
      line-height: 1;
      &:hover {
        color: ${theme.colors.text.primary};
      }
    `,
  };
}

function SecretDataRenderer({ model }: SceneComponentProps<SecretDataSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const hasFrame = data?.series?.some((f: DataFrame) => f.name === 'secret_data');
  if (!hasFrame) {
    return null;
  }

  const entries = extractSecrets(data);
  if (entries.length === 0) {
    return null;
  }

  const toggle = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <CollapsibleSection title="Data">
      {entries.map((entry) => (
        <div key={entry.key} className={styles.secretRow}>
          <span className={styles.secretKey}>{entry.key}</span>
          <button
            className={styles.eyeBtn}
            onClick={() => toggle(entry.key)}
            title={revealed[entry.key] ? 'Hide value' : 'Show value'}
          >
            {revealed[entry.key] ? '🙈' : '👁'}
          </button>
          {revealed[entry.key] ? (
            <span className={styles.secretValue}>{entry.value}</span>
          ) : (
            <span className={styles.secretSize}>{entry.size} bytes</span>
          )}
        </div>
      ))}
    </CollapsibleSection>
  );
}

export class SecretDataSection extends SceneObjectBase<SceneObjectState> {
  static Component = SecretDataRenderer;
}
