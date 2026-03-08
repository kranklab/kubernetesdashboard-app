import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';
import { PLUGIN_BASE_URL } from '../../constants';

function extractNames(data: any, frameName: string): string[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === frameName);
  if (!frame?.fields?.length) {
    return [];
  }
  const nameF = frame.fields.find((f) => f.name === 'Name');
  if (!nameF) {
    return [];
  }
  return Array.from({ length: nameF.values.length }, (_, i) => (nameF.values as any)[i] ?? '');
}

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function ServiceAccountSectionRenderer({ model }: SceneComponentProps<ServiceAccountSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasSecrets = data?.series?.some((f: DataFrame) => f.name === 'sa_secrets');
  const hasImagePullSecrets = data?.series?.some((f: DataFrame) => f.name === 'sa_image_pull_secrets');
  if (!hasSecrets && !hasImagePullSecrets) {
    return null;
  }

  const secrets = extractNames(data, 'sa_secrets');
  const imagePullSecrets = extractNames(data, 'sa_image_pull_secrets');

  const metaFrame: DataFrame | undefined = data?.series?.find((f: DataFrame) => f.name === 'meta');
  const namespace = metaFrame
    ? (metaFrame.fields.find((f) => f.name === 'Namespace')?.values as any)?.[0] ?? ''
    : '';

  return (
    <>
      <CollapsibleSection title="Secrets">
        {secrets.length === 0 ? (
          <div className={styles.emptyState}>
            There is nothing to display here
            <br />
            No resources found.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((name, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <a
                      href={`${PLUGIN_BASE_URL}/config-storage/secret/${namespace}/${name}`}
                      style={{ color: 'rgb(110, 159, 255)' }}
                    >
                      {name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>
      <CollapsibleSection title="Image Pull Secrets">
        {imagePullSecrets.length === 0 ? (
          <div className={styles.emptyState}>
            There is nothing to display here
            <br />
            No resources found.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
              </tr>
            </thead>
            <tbody>
              {imagePullSecrets.map((name, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <a
                      href={`${PLUGIN_BASE_URL}/config-storage/secret/${namespace}/${name}`}
                      style={{ color: 'rgb(110, 159, 255)' }}
                    >
                      {name}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>
    </>
  );
}

export class ServiceAccountSection extends SceneObjectBase<SceneObjectState> {
  static Component = ServiceAccountSectionRenderer;
}
