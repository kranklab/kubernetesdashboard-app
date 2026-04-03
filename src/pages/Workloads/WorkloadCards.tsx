import React, { useState } from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';

type ResourceType = 'pods' | 'deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs';

interface WorkloadRow {
  name: string;
  namespace: string;
  status: string;
  images: string[];
  created: any;
  // pods
  node?: string;
  restarts?: number;
  // deployments / replicasets / daemonsets / statefulsets
  target?: number;
  available?: number;
  // jobs
  succeeded?: number;
  completed?: number | null;
  // cronjobs
  schedule?: string;
  suspend?: boolean | null;
  active?: number;
  lastScheduled?: any;
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

function extractRows(data: any): WorkloadRow[] {
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
  const results: WorkloadRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      status: get('Status') ?? '',
      images: parseJson(get('Images')) ?? [],
      created: get('Created'),
      node: get('Node'),
      restarts: get('Restarts'),
      target: get('Target'),
      available: get('Available'),
      succeeded: get('Succeeded'),
      completed: get('Completed'),
      schedule: get('Schedule'),
      suspend: get('Suspend'),
      active: get('Active'),
      lastScheduled: get('Last Scheduled'),
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

function getStatusInfo(row: WorkloadRow, resourceType: ResourceType, theme: GrafanaTheme2): { text: string; color: string } {
  switch (resourceType) {
    case 'pods': {
      const s = row.status.toLowerCase();
      const color =
        s === 'running' ? theme.colors.success.main :
        s === 'succeeded' ? theme.colors.info.main :
        s === 'pending' ? theme.colors.warning.main :
        s === 'failed' || s === 'crashloopbackoff' ? theme.colors.error.main :
        theme.colors.text.secondary;
      return { text: row.status, color };
    }
    case 'jobs': {
      const done = row.succeeded ?? 0;
      const total = row.completed ?? 0;
      const allDone = total > 0 && done >= total;
      return {
        text: total > 0 ? `${done}/${total} complete` : `${done} succeeded`,
        color: allDone ? theme.colors.success.main : done > 0 ? theme.colors.warning.main : theme.colors.text.secondary,
      };
    }
    case 'cronjobs': {
      if (row.suspend) {
        return { text: 'Suspended', color: theme.colors.warning.main };
      }
      return {
        text: `${row.active ?? 0} active`,
        color: (row.active ?? 0) > 0 ? theme.colors.info.main : theme.colors.success.main,
      };
    }
    default: {
      const target = row.target ?? 0;
      const avail = row.available ?? 0;
      const allReady = avail >= target && target > 0;
      return {
        text: `${avail}/${target} ready`,
        color: allReady ? theme.colors.success.main : avail > 0 ? theme.colors.warning.main : theme.colors.error.main,
      };
    }
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
    statValueSmall: css`
      font-size: ${theme.typography.body.fontSize};
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

interface WorkloadCardProps {
  row: WorkloadRow;
  resourceType: ResourceType;
  styles: ReturnType<typeof getStyles>;
  theme: GrafanaTheme2;
}

function WorkloadCardStats({ row, resourceType, styles, theme }: WorkloadCardProps) {
  switch (resourceType) {
    case 'pods':
      return (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Node</span>
            <span className={styles.statValueSmall}>{row.node || '-'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Restarts</span>
            <span className={styles.statValue} style={{ color: (row.restarts ?? 0) > 0 ? theme.colors.warning.text : theme.colors.text.primary }}>
              {row.restarts ?? 0}
            </span>
          </div>
        </div>
      );
    case 'jobs':
      return (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Succeeded</span>
            <span className={styles.statValue}>{row.succeeded ?? 0}</span>
          </div>
          {row.completed != null && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Completions</span>
              <span className={styles.statValue}>{row.completed}</span>
            </div>
          )}
        </div>
      );
    case 'cronjobs':
      return (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Schedule</span>
            <span className={styles.statValueSmall}>{row.schedule || '-'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Active</span>
            <span className={styles.statValue}>{row.active ?? 0}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Last Scheduled</span>
            <span className={styles.statValueSmall}>{formatAge(row.lastScheduled)}</span>
          </div>
        </div>
      );
    default:
      return (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Target</span>
            <span className={styles.statValue}>{row.target ?? 0}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Available</span>
            <span className={styles.statValue} style={{
              color: (row.available ?? 0) >= (row.target ?? 0) && (row.target ?? 0) > 0
                ? theme.colors.success.text
                : theme.colors.warning.text
            }}>
              {row.available ?? 0}
            </span>
          </div>
        </div>
      );
  }
}

function WorkloadCard({ row, resourceType, styles, theme }: WorkloadCardProps) {
  const [imagesExpanded, setImagesExpanded] = useState(false);
  const visibleImages = imagesExpanded ? row.images : row.images.slice(0, 1);
  const hiddenCount = row.images.length - 1;
  const { text: statusText, color: statusColor } = getStatusInfo(row, resourceType, theme);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.name} title={row.name}>{row.name}</div>
          <div className={styles.namespace}>{row.namespace}</div>
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
      <WorkloadCardStats row={row} resourceType={resourceType} styles={styles} theme={theme} />
      {row.images.length > 0 && (
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
      <div className={styles.age}>Created {formatAge(row.created)}</div>
    </div>
  );
}

export interface WorkloadCardsState extends SceneObjectState {
  resourceType: ResourceType;
  drilldownUrl?: string;
}

function WorkloadCardsRenderer({ model }: SceneComponentProps<WorkloadCards>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { data } = sceneGraph.getData(model).useState();
  const { drilldownUrl, resourceType } = model.useState();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(24);

  const rows = extractRows(data);

  if (!data?.series?.length) {
    return null;
  }

  if (rows.length === 0) {
    return <div className={styles.emptyState}>No resources found.</div>;
  }

  const totalPages = Math.ceil(rows.length / pageSize);
  const start = page * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div>
      <div className={styles.paginationBar}>
        <span className={styles.paginationInfo}>
          {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length}
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
        {pageRows.map((row, i) => {
          const href = drilldownUrl
            ?.replace('${namespace}', row.namespace)
            ?.replace('${name}', row.name);

          const cardContent = (
            <WorkloadCard
              key={i}
              row={row}
              resourceType={resourceType}
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

export class WorkloadCards extends SceneObjectBase<WorkloadCardsState> {
  static Component = WorkloadCardsRenderer;
}
