import React, { useState } from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';

interface DeploymentRow {
  name: string;
  namespace: string;
  status: string;
  images: string[];
  labels: Record<string, string>;
  target: number;
  available: number;
  created: any;
}

function parseJson(val: any): any {
  if (!val) {
    return undefined;
  }
  if (typeof val === 'object') {
    return val;
  }
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function extractDeployments(data: any): DeploymentRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame = data.series[0];
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const count = col('Name')?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: DeploymentRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      status: get('Status') ?? '',
      images: parseJson(get('Images')) ?? [],
      labels: parseJson(get('Labels')) ?? {},
      target: get('Target') ?? 0,
      available: get('Available') ?? 0,
      created: get('Created'),
    });
  }
  return results;
}

function formatAge(ts: any): string {
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
  return {
    grid: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: ${theme.spacing(1.5)};
      padding: ${theme.spacing(1)};
    `,
    card: css`
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(2)};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1.5)};
      cursor: pointer;
      transition: border-color 0.15s ease;
      &:hover {
        border-color: ${theme.colors.border.medium};
      }
    `,
    header: css`
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      min-width: 0;
    `,
    headerText: css`
      min-width: 0;
      overflow: hidden;
    `,
    name: css`
      font-size: ${theme.typography.h5.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.text.link};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,
    statusBadge: css`
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: ${theme.shape.radius.pill};
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: ${theme.spacing(1)};
    `,
    namespace: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    statsRow: css`
      display: flex;
      gap: ${theme.spacing(3)};
    `,
    stat: css`
      display: flex;
      flex-direction: column;
    `,
    statLabel: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    statValue: css`
      font-size: ${theme.typography.h4.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.text.primary};
    `,
    imagesRow: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(0.5)};
      align-items: center;
    `,
    imageChip: css`
      display: inline-block;
      padding: 2px 8px;
      border-radius: 2px;
      font-size: 11px;
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.medium};
      color: ${theme.colors.text.secondary};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 80px);
    `,
    imagesToggle: css`
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 2px;
      font-size: 11px;
      background: none;
      border: 1px solid ${theme.colors.border.medium};
      color: ${theme.colors.text.link};
      cursor: pointer;
      white-space: nowrap;
      &:hover {
        background: ${theme.colors.background.canvas};
      }
    `,
    age: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    emptyState: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.body.fontSize};
      text-align: center;
      padding: ${theme.spacing(4)};
    `,
    paginationBar: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${theme.spacing(1, 1, 0, 1)};
    `,
    paginationInfo: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    paginationControls: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
    `,
    pageButton: css`
      padding: ${theme.spacing(0.5, 1.5)};
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.secondary};
      color: ${theme.colors.text.primary};
      font-size: ${theme.typography.bodySmall.fontSize};
      cursor: pointer;
      &:hover:not(:disabled) {
        background: ${theme.colors.background.canvas};
      }
      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    `,
    pageSizeButton: css`
      padding: ${theme.spacing(0.5, 1.5)};
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.secondary};
      color: ${theme.colors.text.primary};
      font-size: ${theme.typography.bodySmall.fontSize};
      cursor: pointer;
      &:hover {
        background: ${theme.colors.background.canvas};
      }
    `,
    pageSizeButtonActive: css`
      padding: ${theme.spacing(0.5, 1.5)};
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.text.link};
      background: ${theme.colors.background.canvas};
      color: ${theme.colors.text.link};
      font-size: ${theme.typography.bodySmall.fontSize};
      cursor: pointer;
    `,
  };
}

interface DeploymentCardProps {
  dep: DeploymentRow;
  statusColor: string;
  statusText: string;
  allReady: boolean;
  styles: ReturnType<typeof getStyles>;
  theme: GrafanaTheme2;
}

function DeploymentCard({ dep, statusColor, statusText, allReady, styles, theme }: DeploymentCardProps) {
  const [imagesExpanded, setImagesExpanded] = useState(false);
  const visibleImages = imagesExpanded ? dep.images : dep.images.slice(0, 1);
  const hiddenCount = dep.images.length - 1;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.name} title={dep.name}>{dep.name}</div>
          <div className={styles.namespace}>{dep.namespace}</div>
        </div>
        <span
          className={styles.statusBadge}
          style={{
            background: theme.colors.background.canvas,
            border: `1px solid ${statusColor}`,
            color: statusColor,
          }}
        >
          {statusText}
        </span>
      </div>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Target</span>
          <span className={styles.statValue}>{dep.target}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Available</span>
          <span className={styles.statValue} style={{ color: allReady ? theme.colors.success.text : theme.colors.warning.text }}>
            {dep.available}
          </span>
        </div>
      </div>
      {dep.images.length > 0 && (
        <div className={styles.imagesRow}>
          {visibleImages.map((img, j) => (
            <span key={j} className={styles.imageChip} title={img}>
              {img}
            </span>
          ))}
          {hiddenCount > 0 && (
            <button
              className={styles.imagesToggle}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setImagesExpanded(!imagesExpanded);
              }}
            >
              {imagesExpanded ? 'show less' : `+${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
      <div className={styles.age}>Created {formatAge(dep.created)}</div>
    </div>
  );
}

export interface DeploymentsCardsState extends SceneObjectState {
  drilldownUrl?: string;
}

function DeploymentsCardsRenderer({ model }: SceneComponentProps<DeploymentsCards>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { data } = sceneGraph.getData(model).useState();
  const { drilldownUrl } = model.useState();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(24);

  const deployments = extractDeployments(data);

  if (!data?.series?.length) {
    return null;
  }

  if (deployments.length === 0) {
    return <div className={styles.emptyState}>No deployments found.</div>;
  }

  const totalPages = Math.ceil(deployments.length / pageSize);
  const start = page * pageSize;
  const pageDeployments = deployments.slice(start, start + pageSize);

  return (
    <div>
      <div className={styles.paginationBar}>
        <span className={styles.paginationInfo}>
          {start + 1}–{Math.min(start + pageSize, deployments.length)} of {deployments.length}
        </span>
        <div className={styles.paginationControls}>
          {[24, 48].map((size) => (
            <button
              key={size}
              className={pageSize === size ? styles.pageSizeButtonActive : styles.pageSizeButton}
              onClick={() => {
                setPageSize(size);
                setPage(0);
              }}
            >
              {size}
            </button>
          ))}
          <button className={styles.pageButton} disabled={page === 0} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span className={styles.paginationInfo}>
            {page + 1} / {totalPages}
          </span>
          <button className={styles.pageButton} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {pageDeployments.map((dep, i) => {
          const allReady = dep.available >= dep.target && dep.target > 0;
          const statusColor = allReady ? theme.colors.success.main : dep.available > 0 ? theme.colors.warning.main : theme.colors.error.main;
          const statusText = `${dep.available}/${dep.target} ready`;

          const href = drilldownUrl
            ?.replace('${namespace}', dep.namespace)
            ?.replace('${name}', dep.name);

          const cardContent = (
            <DeploymentCard
              key={i}
              dep={dep}
              statusColor={statusColor}
              statusText={statusText}
              allReady={allReady}
              styles={styles}
              theme={theme}
            />
          );

          if (href) {
            return (
              <a key={i} href={href} style={{ textDecoration: 'none' }}>
                {cardContent}
              </a>
            );
          }
          return cardContent;
        })}
      </div>
    </div>
  );
}

export class DeploymentsCards extends SceneObjectBase<DeploymentsCardsState> {
  static Component = DeploymentsCardsRenderer;
}
