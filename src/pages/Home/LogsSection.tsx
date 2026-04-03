import React, { useState } from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTimeFormat } from '@grafana/data';
import { config } from '@grafana/runtime';

interface LogLine {
  timestamp: Date | null;
  container: string;
  message: string;
  level: string;
}

const LOG_LEVEL_COLORS: Record<string, string> = {
  error: '#FF5286',
  err: '#FF5286',
  fatal: '#FF5286',
  panic: '#FF5286',
  warn: '#FF9830',
  warning: '#FF9830',
  info: '#73BF69',
  debug: '#8AB8FF',
  trace: '#B877D9',
};

function detectLevel(msg: string): string {
  const lower = msg.toLowerCase();
  for (const level of ['fatal', 'panic', 'error', 'err', 'warn', 'warning', 'info', 'debug', 'trace']) {
    if (
      lower.includes(`level=${level}`) ||
      lower.includes(`"level":"${level}"`) ||
      lower.includes(`"level": "${level}"`) ||
      lower.includes(`[${level}]`) ||
      lower.startsWith(level + ':') ||
      lower.startsWith(level + ' ') ||
      lower.startsWith(level + '\t')
    ) {
      return level;
    }
  }
  return '';
}

function extractLogs(data: any): LogLine[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === 'logs');
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const tsF = col('Timestamp');
  const containerF = col('Container');
  const msgF = col('Message');
  const count = tsF?.values.length ?? 0;
  const lines: LogLine[] = [];
  for (let i = 0; i < count; i++) {
    const rawTs = (tsF?.values as any)?.[i];
    const message = (msgF?.values as any)?.[i] ?? '';
    lines.push({
      timestamp: rawTs ? new Date(rawTs) : null,
      container: (containerF?.values as any)?.[i] ?? '',
      message,
      level: detectLevel(message),
    });
  }
  return lines;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    toolbar: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1.5)};
      margin-bottom: ${theme.spacing(1.5)};
      flex-wrap: wrap;
    `,
    label: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    select: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.medium};
      border-radius: ${theme.shape.radius.default};
      color: ${theme.colors.text.primary};
      padding: ${theme.spacing(0.5, 1)};
    `,
    lokiButton: css`
      display: inline-flex;
      align-items: center;
      gap: ${theme.spacing(0.75)};
      margin-left: auto;
      padding: ${theme.spacing(0.75, 2)};
      border-radius: ${theme.shape.radius.default};
      border: none;
      background: ${theme.colors.primary.main};
      color: ${theme.colors.primary.contrastText};
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      cursor: pointer;
      text-decoration: none;
      &:hover {
        background: ${theme.colors.primary.shade};
        color: ${theme.colors.primary.contrastText};
      }
    `,
    searchInput: css`
      padding: ${theme.spacing(0.5, 1)};
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.canvas};
      color: ${theme.colors.text.primary};
      font-size: ${theme.typography.bodySmall.fontSize};
      width: 200px;
      outline: none;
      &:focus {
        border-color: ${theme.colors.primary.border};
      }
      &::placeholder {
        color: ${theme.colors.text.disabled};
      }
    `,
    logCount: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      margin-left: ${theme.spacing(1)};
    `,
    logContainer: css`
      background: ${theme.colors.background.primary};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      overflow-y: auto;
      max-height: 700px;
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: 12px;
      line-height: 1;
    `,
    logLine: css`
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid ${theme.colors.border.weak};
      &:last-child {
        border-bottom: none;
      }
      &:hover {
        background: ${theme.colors.background.secondary};
      }
    `,
    levelIndicator: css`
      width: 4px;
      flex-shrink: 0;
    `,
    timestamp: css`
      color: ${theme.colors.text.disabled};
      white-space: nowrap;
      flex-shrink: 0;
      padding: ${theme.spacing(0.5, 1)};
      border-right: 1px solid ${theme.colors.border.weak};
      user-select: none;
    `,
    container: css`
      color: ${theme.colors.primary.text};
      white-space: nowrap;
      flex-shrink: 0;
      padding: ${theme.spacing(0.5, 1)};
      border-right: 1px solid ${theme.colors.border.weak};
    `,
    message: css`
      color: ${theme.colors.text.primary};
      word-break: break-all;
      white-space: pre-wrap;
      padding: ${theme.spacing(0.5, 1)};
      flex: 1;
      min-width: 0;
    `,
    empty: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
      padding: ${theme.spacing(4)};
      text-align: center;
    `,
  };
}

function buildLokiExploreUrl(namespace?: string, podName?: string): string | null {
  if (!namespace || !podName) {
    return null;
  }
  const datasources = config.datasources ?? {};
  const lokiDs = Object.values(datasources).find((ds: any) => ds.type === 'loki');
  if (!lokiDs) {
    return null;
  }
  const query = `{namespace="${namespace}", pod="${podName}"}`;
  const left = JSON.stringify({
    datasource: lokiDs.uid,
    queries: [{ refId: 'A', expr: query }],
    range: { from: 'now-1h', to: 'now' },
  });
  return `/explore?left=${encodeURIComponent(left)}`;
}


function LogsSectionRenderer({ model }: SceneComponentProps<LogsSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const { podName, namespace } = model.useState();
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [search, setSearch] = useState('');

  const allLogs = extractLogs(data);

  const containers = Array.from(new Set(allLogs.map((l) => l.container))).filter(Boolean);
  const query = search.toLowerCase();
  const filtered = allLogs.filter((l) => {
    if (selectedContainer && l.container !== selectedContainer) {
      return false;
    }
    if (query && !l.message.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
  const showContainerCol = containers.length > 1 && !selectedContainer;
  const lokiUrl = buildLokiExploreUrl(namespace, podName);

  if (allLogs.length === 0 && (!data?.series?.length || !data.series.find((f: DataFrame) => f.name === 'logs'))) {
    return null;
  }

  return (
    <div>
      <div className={styles.toolbar}>
        {containers.length > 1 && (
          <>
            <span className={styles.label}>Container:</span>
            <select
              className={styles.select}
              value={selectedContainer}
              onChange={(e) => setSelectedContainer(e.target.value)}
            >
              <option value="">All</option>
              {containers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.logCount}>{filtered.length} lines</span>
        {lokiUrl && (
          <a className={styles.lokiButton} href={lokiUrl} target="_blank" rel="noopener noreferrer">
            Open in Loki
          </a>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className={styles.empty}>No log lines found.</div>
      ) : (
        <div className={styles.logContainer}>
          {filtered.map((line, i) => {
            const levelColor = LOG_LEVEL_COLORS[line.level] ?? 'transparent';
            return (
              <div key={i} className={styles.logLine}>
                <div className={styles.levelIndicator} style={{ background: levelColor }} />
                <span className={styles.timestamp}>
                  {line.timestamp
                    ? dateTimeFormat(line.timestamp.getTime(), { format: 'YYYY-MM-DD HH:mm:ss.SSS' })
                    : ''}
                </span>
                {showContainerCol && <span className={styles.container}>{line.container}</span>}
                <span className={styles.message}>{line.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface LogsSectionState extends SceneObjectState {
  podName?: string;
  namespace?: string;
}

export class LogsSection extends SceneObjectBase<LogsSectionState> {
  static Component = LogsSectionRenderer;
}
