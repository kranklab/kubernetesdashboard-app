import React, { useState } from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';

// Generic row: pulls every possible field from the data frame.
// Missing fields are undefined — card renderers handle that gracefully.
interface ResourceRow {
  [key: string]: any;
  name: string;
  namespace: string;
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

function extractRows(data: any): ResourceRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame = data.series[0];
  if (!frame?.fields?.length) {
    return [];
  }
  const count = frame.fields[0]?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: ResourceRow[] = [];
  for (let i = 0; i < count; i++) {
    const row: any = {};
    for (const field of frame.fields) {
      const val = (field.values as any)?.[i];
      // Normalise field name to camelCase-ish key for easy access
      const key = field.name;
      row[key] = val;
    }
    results.push({
      ...row,
      name: row['Name'] ?? '',
      namespace: row['Namespace'] ?? '',
      created: row['Created'],
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

function jsonArr(val: any): string[] {
  const parsed = parseJson(val);
  if (Array.isArray(parsed)) {
    return parsed.map((v) => (v && typeof v === 'object' ? JSON.stringify(v) : String(v)));
  }
  return [];
}

// ── Badge config per resource type ──────────────────────────────────────────

interface BadgeInfo {
  text: string;
  color: string;
}

function getBadge(row: ResourceRow, resourceType: string, theme: GrafanaTheme2): BadgeInfo | null {
  const success = theme.colors.success.main;
  const warning = theme.colors.warning.main;
  const error = theme.colors.error.main;
  const info = theme.colors.info.main;
  const muted = theme.colors.text.secondary;

  switch (resourceType) {
    // ── Workloads ──
    case 'pods': {
      const s = (row['Status'] ?? '').toLowerCase();
      const color =
        s === 'running' ? success :
        s === 'succeeded' ? info :
        s === 'pending' ? warning :
        s === 'failed' || s === 'crashloopbackoff' ? error : muted;
      return { text: row['Status'] || '-', color };
    }
    case 'deployments':
    case 'replicasets':
    case 'daemonsets':
    case 'statefulsets': {
      const target = row['Target'] ?? 0;
      const avail = row['Available'] ?? 0;
      const ready = avail >= target && target > 0;
      return {
        text: `${avail}/${target} ready`,
        color: ready ? success : avail > 0 ? warning : error,
      };
    }
    case 'jobs': {
      const done = row['Succeeded'] ?? 0;
      const total = row['Completed'] ?? 0;
      return {
        text: total > 0 ? `${done}/${total} complete` : `${done} succeeded`,
        color: total > 0 && done >= total ? success : done > 0 ? warning : muted,
      };
    }
    case 'cronjobs': {
      if (row['Suspend']) {
        return { text: 'Suspended', color: warning };
      }
      const active = row['Active'] ?? 0;
      return { text: `${active} active`, color: active > 0 ? info : success };
    }

    // ── Networking ──
    case 'services': {
      const t = row['Type'] ?? '';
      const color = t === 'LoadBalancer' ? info : t === 'NodePort' ? warning : muted;
      return { text: t || '-', color };
    }
    case 'ingresses':
      return { text: row['TLS'] ? 'TLS' : 'No TLS', color: row['TLS'] ? success : warning };
    case 'ingressclasses':
      return null;

    // ── Config & Storage ──
    case 'configmaps': {
      const keys = jsonArr(row['Keys']);
      return { text: `${keys.length} key${keys.length !== 1 ? 's' : ''}`, color: muted };
    }
    case 'persistentvolumeclaims': {
      const s = (row['Status'] ?? '').toLowerCase();
      return { text: row['Status'] || '-', color: s === 'bound' ? success : s === 'pending' ? warning : error };
    }
    case 'secrets':
      return { text: row['Type'] ?? '-', color: muted };
    case 'storageclasses':
      return { text: row['Reclaim Policy'] ?? '-', color: muted };

    // ── Cluster ──
    case 'nodes': {
      const s = (row['Status'] ?? '').toLowerCase();
      return { text: row['Status'] || '-', color: s === 'ready' ? success : error };
    }
    case 'persistentvolumes': {
      const s = (row['Status'] ?? '').toLowerCase();
      const color = s === 'bound' ? success : s === 'available' ? info : s === 'released' ? warning : error;
      return { text: row['Status'] || '-', color };
    }
    case 'events': {
      const t = (row['Type'] ?? '').toLowerCase();
      return { text: row['Type'] || '-', color: t === 'warning' ? warning : info };
    }
    case 'clusterrolebindings':
    case 'rolebindings':
      return null;
    case 'clusterroles':
    case 'roles': {
      const n = row['Rules'] ?? 0;
      return { text: `${n} rule${n !== 1 ? 's' : ''}`, color: muted };
    }
    case 'serviceaccounts': {
      const n = row['Secrets'] ?? 0;
      return { text: `${n} secret${n !== 1 ? 's' : ''}`, color: muted };
    }
    case 'networkpolicies':
      return null;
    case 'namespaces':
      return null;

    // ── CRDs ──
    case 'customresourcedefinitions':
      return { text: row['Scope'] ?? '-', color: muted };

    default:
      return row['Status'] ? { text: row['Status'], color: muted } : null;
  }
}

// ── Stats config per resource type ──────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  large?: boolean;
  color?: string;
}

function getStats(row: ResourceRow, resourceType: string, theme: GrafanaTheme2): StatItem[] {
  switch (resourceType) {
    // ── Workloads ──
    case 'pods':
      return [
        { label: 'Node', value: row['Node'] || '-' },
        { label: 'Restarts', value: String(row['Restarts'] ?? 0), large: true, color: (row['Restarts'] ?? 0) > 0 ? theme.colors.warning.text : undefined },
      ];
    case 'deployments':
    case 'replicasets':
    case 'daemonsets':
    case 'statefulsets': {
      const target = row['Target'] ?? 0;
      const avail = row['Available'] ?? 0;
      return [
        { label: 'Target', value: String(target), large: true },
        { label: 'Available', value: String(avail), large: true, color: avail >= target && target > 0 ? theme.colors.success.text : theme.colors.warning.text },
      ];
    }
    case 'jobs':
      return [
        { label: 'Succeeded', value: String(row['Succeeded'] ?? 0), large: true },
        ...(row['Completed'] != null ? [{ label: 'Completions', value: String(row['Completed']), large: true }] : []),
      ];
    case 'cronjobs':
      return [
        { label: 'Schedule', value: row['Schedule'] || '-' },
        { label: 'Active', value: String(row['Active'] ?? 0), large: true },
        { label: 'Last Scheduled', value: formatAge(row['Last Scheduled']) },
      ];

    // ── Networking ──
    case 'services':
      return [
        { label: 'Cluster IP', value: row['Cluster IP'] || '-' },
      ];
    case 'ingresses':
      return [
        { label: 'Class', value: row['Class'] || '-' },
      ];
    case 'ingressclasses':
      return [
        { label: 'Controller', value: row['Controller'] || '-' },
      ];

    // ── Config & Storage ──
    case 'configmaps':
      return [];
    case 'persistentvolumeclaims':
      return [
        { label: 'Storage Class', value: row['Storage Class'] || '-' },
        { label: 'Capacity', value: row['Capacity'] || '-' },
      ];
    case 'secrets':
      return [];
    case 'storageclasses':
      return [
        { label: 'Provisioner', value: row['Provisioner'] || '-' },
        { label: 'Binding Mode', value: row['Volume Binding Mode'] || '-' },
      ];

    // ── Cluster ──
    case 'nodes':
      return [
        { label: 'CPU Requests', value: row['CPU Requests'] ?? '-' },
        { label: 'CPU Limits', value: row['CPU Limits'] ?? '-' },
        { label: 'CPU Capacity', value: row['CPU Capacity'] ?? '-' },
        { label: 'Mem Requests', value: row['Memory Requests'] ?? '-' },
        { label: 'Mem Limits', value: row['Memory Limits'] ?? '-' },
        { label: 'Mem Capacity', value: row['Memory Capacity'] ?? '-' },
        { label: 'Pods', value: row['Pods'] != null ? String(row['Pods']) : '-', large: true },
      ];
    case 'persistentvolumes':
      return [
        { label: 'Storage Class', value: row['Storage Class'] || '-' },
        { label: 'Capacity', value: row['Capacity'] || '-' },
        { label: 'Claim', value: row['Claim'] || '-' },
      ];
    case 'events':
      return [
        { label: 'Reason', value: row['Reason'] || '-' },
        { label: 'Object', value: row['Object'] || '-' },
        { label: 'Count', value: String(row['Count'] ?? 0), large: true },
      ];
    case 'clusterrolebindings':
    case 'rolebindings':
      return [
        { label: 'Role', value: row['Role'] || '-' },
      ];
    case 'clusterroles':
    case 'roles':
      return [];
    case 'serviceaccounts':
      return [];
    case 'networkpolicies':
      return [
        { label: 'Pod Selector', value: row['Pod Selector'] || '-' },
      ];
    case 'namespaces':
      return [];

    // ── CRDs ──
    case 'customresourcedefinitions':
      return [
        { label: 'Group', value: row['Group'] || '-' },
        { label: 'Kind', value: row['Kind'] || '-' },
      ];

    default:
      return [];
  }
}

// ── Chips (expandable list) per resource type ───────────────────────────────

function getChips(row: ResourceRow, resourceType: string): string[] {
  switch (resourceType) {
    case 'pods':
    case 'deployments':
    case 'replicasets':
    case 'daemonsets':
    case 'statefulsets':
    case 'jobs':
    case 'cronjobs':
      return jsonArr(row['Images']);
    case 'services': {
      const ports = parseJson(row['Ports']);
      if (!Array.isArray(ports)) {
        return [];
      }
      return ports.map((p: any) => {
        if (p && typeof p === 'object') {
          const proto = p.protocol ?? 'TCP';
          const port = p.port ?? '';
          const target = p.targetPort ?? '';
          const name = p.name ? `${p.name}: ` : '';
          return `${name}${port}→${target}/${proto}`;
        }
        return String(p);
      });
    }
    case 'ingresses':
      return jsonArr(row['Hosts']);
    case 'configmaps':
    case 'secrets':
      return jsonArr(row['Keys']);
    case 'persistentvolumeclaims':
    case 'persistentvolumes':
      return jsonArr(row['Access Modes']);
    case 'clusterrolebindings':
    case 'rolebindings': {
      const subjects = parseJson(row['Subjects']);
      if (!Array.isArray(subjects)) {
        return [];
      }
      return subjects.map((s: any) => {
        if (s && typeof s === 'object' && s.kind) {
          return `${s.kind}/${s.name ?? ''}${s.namespace ? ` (${s.namespace})` : ''}`;
        }
        return String(s);
      });
    }
    case 'networkpolicies':
      return jsonArr(row['Policy Types']);
    default:
      return [];
  }
}

// ── Styles ──────────────────────────────────────────────────────────────────

function getStyles(theme: GrafanaTheme2) {
  return {
    grid: css`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: ${theme.spacing(1.5)};
      padding: ${theme.spacing(1)};
    `,
    card: css`
      position: relative;
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(2)};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      cursor: pointer;
      transition: border-color 0.15s ease;
      &:hover {
        border-color: ${theme.colors.border.medium};
      }
    `,
    cardOverlay: css`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border.medium};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(2)};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      cursor: pointer;
      box-shadow: ${theme.shadows.z3};
    `,
    expandToggle: css`
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.colors.text.secondary};
      font-size: 12px;
      padding: 0;
      margin-top: ${theme.spacing(0.5)};
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      &:hover {
        color: ${theme.colors.text.link};
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
      flex-wrap: wrap;
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
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    `,
    chipsRow: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(0.5)};
      align-items: center;
    `,
    chip: css`
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
    chipsToggle: css`
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
    message: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `,
    emptyState: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.body.fontSize};
      text-align: center;
      padding: ${theme.spacing(4)};
    `,
    toolbar: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${theme.spacing(1, 1, 0, 1)};
      gap: ${theme.spacing(2)};
    `,
    searchInput: css`
      padding: ${theme.spacing(0.75, 1.5)};
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.secondary};
      color: ${theme.colors.text.primary};
      font-size: ${theme.typography.body.fontSize};
      width: 250px;
      outline: none;
      &:focus {
        border-color: ${theme.colors.primary.border};
      }
      &::placeholder {
        color: ${theme.colors.text.disabled};
      }
    `,
    paginationBar: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${theme.spacing(0.5, 1, 0, 1)};
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

// ── Card component ──────────────────────────────────────────────────────────

interface CardProps {
  row: ResourceRow;
  resourceType: string;
  styles: ReturnType<typeof getStyles>;
  theme: GrafanaTheme2;
  href?: string;
}

function CardHeader({ row, badge, styles, theme, href }: { row: ResourceRow; badge: BadgeInfo | null; styles: ReturnType<typeof getStyles>; theme: GrafanaTheme2; href?: string }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>
        {href ? (
          <a className={styles.name} title={row.name} href={href} onClick={(e) => e.stopPropagation()}>{row.name}</a>
        ) : (
          <div className={styles.name} title={row.name}>{row.name}</div>
        )}
        {row.namespace && <div className={styles.namespace}>{row.namespace}</div>}
      </div>
      {badge && (
        <span
          className={styles.statusBadge}
          style={{
            background: theme.colors.background.canvas,
            border: `1px solid ${badge.color}`,
            color: badge.color,
          }}
        >
          {badge.text}
        </span>
      )}
    </div>
  );
}

function CardDetails({ row, resourceType, stats, chips, styles, theme }: {
  row: ResourceRow; resourceType: string; stats: StatItem[]; chips: string[];
  styles: ReturnType<typeof getStyles>; theme: GrafanaTheme2;
}) {
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const visibleChips = chipsExpanded ? chips : chips.slice(0, 1);
  const hiddenCount = chips.length - 1;

  return (
    <>
      {stats.length > 0 && (
        <div className={styles.statsRow}>
          {stats.map((s, j) => (
            <div key={j} className={styles.stat}>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={s.large ? styles.statValue : styles.statValueSmall} style={s.color ? { color: s.color } : undefined}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {chips.length > 0 && (
        <div className={styles.chipsRow}>
          {visibleChips.map((c, j) => (
            <span key={j} className={styles.chip} title={c}>{c}</span>
          ))}
          {hiddenCount > 0 && (
            <button
              className={styles.chipsToggle}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setChipsExpanded(!chipsExpanded);
              }}
            >
              {chipsExpanded ? 'show less' : `+${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
      {resourceType === 'events' && row['Message'] && (
        <div className={styles.message} title={row['Message']}>{row['Message']}</div>
      )}
      {row.created && <div className={styles.age}>Created {formatAge(row.created)}</div>}
    </>
  );
}

function ResourceCard({ row, resourceType, styles, theme, href }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const badge = getBadge(row, resourceType, theme);
  const stats = getStats(row, resourceType, theme);
  const chips = getChips(row, resourceType);
  const hasBody = stats.length > 0 || chips.length > 0 || (resourceType === 'events' && row['Message']) || row.created;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div className={styles.card} onClick={hasBody && !expanded ? toggleExpand : undefined}>
      <CardHeader row={row} badge={badge} styles={styles} theme={theme} href={href} />
      {hasBody && !expanded && (
        <span className={styles.expandToggle}>▼</span>
      )}
      {expanded && (
        <div className={styles.cardOverlay} onClick={(e) => e.stopPropagation()}>
          <CardHeader row={row} badge={badge} styles={styles} theme={theme} href={href} />
          <CardDetails row={row} resourceType={resourceType} stats={stats} chips={chips} styles={styles} theme={theme} />
          <button className={styles.expandToggle} onClick={toggleExpand}>
            ▲
          </button>
        </div>
      )}
    </div>
  );
}

// ── Scene object ────────────────────────────────────────────────────────────

export interface ResourceCardsState extends SceneObjectState {
  resourceType: string;
  drilldownUrl?: string;
}

function ResourceCardsRenderer({ model }: SceneComponentProps<ResourceCards>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const { data } = sceneGraph.getData(model).useState();
  const { drilldownUrl, resourceType } = model.useState();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [search, setSearch] = useState('');

  const allRows = extractRows(data);

  if (!data?.series?.length) {
    return null;
  }

  if (allRows.length === 0) {
    return <div className={styles.emptyState}>No resources found.</div>;
  }

  const query = search.toLowerCase();
  const rows = query
    ? allRows.filter((r) => r.name.toLowerCase().includes(query) || r.namespace.toLowerCase().includes(query))
    : allRows;

  const totalPages = Math.ceil(rows.length / pageSize);
  const safePage = Math.min(page, Math.max(totalPages - 1, 0));
  const start = safePage * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by name or namespace..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
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
        </div>
      </div>
      <div className={styles.paginationBar}>
        <span className={styles.paginationInfo}>
          {rows.length > 0 ? `${start + 1}–${Math.min(start + pageSize, rows.length)} of ${rows.length}` : '0 results'}
        </span>
        <div className={styles.paginationControls}>
          <button className={styles.pageButton} disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            Prev
          </button>
          <span className={styles.paginationInfo}>
            {totalPages > 0 ? `${safePage + 1} / ${totalPages}` : '-'}
          </span>
          <button className={styles.pageButton} disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
            Next
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {pageRows.map((row, i) => {
          const href = drilldownUrl
            ?.replace('${namespace}', row.namespace)
            ?.replace('${name}', encodeURIComponent(row.name));

          return (
            <ResourceCard key={i} row={row} resourceType={resourceType} styles={styles} theme={theme} href={href} />
          );
        })}
      </div>
    </div>
  );
}

export class ResourceCards extends SceneObjectBase<ResourceCardsState> {
  static Component = ResourceCardsRenderer;
}
