import React from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection } from './CollapsibleSection';
import { getFieldValue } from './MetadataHeader';

function getDataFrame(data: any): DataFrame | undefined {
  if (!data?.series?.length) {
    return undefined;
  }
  return data.series.find((f: DataFrame) => f.name === 'cm_data');
}

function getStyles(theme: GrafanaTheme2) {
  return {
    codeBlock: css`
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(2)};
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.primary};
      white-space: pre;
      overflow: auto;
      max-height: 600px;
    `,
  };
}

function DataSectionRenderer({ model }: SceneComponentProps<DataSection>) {
  const styles = useStyles2(getStyles);
  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();

  const frame = getDataFrame(data);
  if (!frame) {
    return null;
  }

  const rawJson = getFieldValue(frame, 'Data');
  if (!rawJson) {
    return null;
  }

  let formatted: string;
  try {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    formatted = String(rawJson);
  }

  return (
    <CollapsibleSection title="Data">
      <pre className={styles.codeBlock}>{formatted}</pre>
    </CollapsibleSection>
  );
}

export class DataSection extends SceneObjectBase<SceneObjectState> {
  static Component = DataSectionRenderer;
}
