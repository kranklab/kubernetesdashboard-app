import React from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';

function extractYaml(data: any): string {
  if (!data?.series?.length) {
    return '';
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'yaml');
  if (!frame?.fields?.length) {
    return '';
  }
  const field = frame.fields[0];
  return field?.values?.length ? String((field.values as any)[0]) : '';
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      overflow-y: auto;
      max-height: 800px;
      padding: ${theme.spacing(2)};
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
      white-space: pre-wrap;
      word-break: break-all;
      color: ${theme.colors.text.primary};
    `,
    empty: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
      padding: ${theme.spacing(2)};
      text-align: center;
    `,
  };
}

function YamlSectionRenderer({ model }: SceneComponentProps<YamlSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const yaml = extractYaml(data);

  if (!yaml) {
    return <div className={styles.empty}>No YAML available.</div>;
  }

  return <pre className={styles.container}>{yaml}</pre>;
}

export class YamlSection extends SceneObjectBase<SceneObjectState> {
  static Component = YamlSectionRenderer;
}
