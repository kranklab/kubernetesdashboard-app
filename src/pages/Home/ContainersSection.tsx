import React, { useState } from 'react';
import { css } from '@emotion/css';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

// ── Types ────────────────────────────────────────────────────────────────────

interface EnvVar {
  name: string;
  value?: string;
}

interface Mount {
  name: string;
  readOnly?: boolean;
  mountPath?: string;
  subPath?: string;
  type?: string;
  sourceType?: string;
  sourceName?: string;
}

interface ProbeHttp {
  path?: string;
  port?: string | number;
}

interface ReadinessProbe {
  initialDelaySeconds?: number;
  timeoutSeconds?: number;
  periodSeconds?: number;
  successThreshold?: number;
  failureThreshold?: number;
  httpGet?: ProbeHttp;
  exec?: { command?: string[] };
}

interface SecurityContext {
  runAsUser?: number;
  runAsGroup?: number;
  runAsNonRoot?: boolean;
  capabilities?: { drop?: string[] };
  readOnlyRootFilesystem?: boolean;
  allowPrivilegeEscalation?: boolean;
}

interface ResourceMap {
  cpu?: string;
  memory?: string;
}

interface Container {
  name: string;
  image?: string;
  ready?: string | boolean;
  started?: string | boolean;
  reason?: string;
  env?: EnvVar[];
  command?: string[];
  args?: string[];
  mounts?: Mount[];
  readinessProbe?: ReadinessProbe;
  securityContext?: SecurityContext;
  limits?: ResourceMap;
  requests?: ResourceMap;
}

// ── Data extraction ──────────────────────────────────────────────────────────

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

function extractContainers(data: any): Container[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find(
    (f: DataFrame) => f.name === 'containers'
  );
  if (!frame?.fields?.length) {
    return [];
  }

  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = (nameF?.values as any)?.length ?? 0;
  if (count === 0) {
    return [];
  }

  const containers: Container[] = [];
  for (let i = 0; i < count; i++) {
    const get = (fieldName: string) => (col(fieldName)?.values as any)?.[i];

    containers.push({
      name: get('Name') ?? '',
      image: get('Image'),
      ready: get('Ready'),
      started: get('Started'),
      reason: get('Reason'),
      env: parseJson(get('Env')),
      command: parseJson(get('Command')),
      args: parseJson(get('Args')),
      mounts: parseJson(get('Mounts')),
      readinessProbe: parseJson(get('Readiness Probe')),
      securityContext: parseJson(get('Security Context')),
      limits: parseJson(get('Limits')),
      requests: parseJson(get('Requests')),
    });
  }
  return containers;
}

function isReady(ready: string | boolean | undefined): boolean {
  return ready === true || ready === 'true';
}

function boolStr(val: string | boolean | undefined): string {
  if (val === undefined || val === null) {
    return '-';
  }
  return String(val);
}

// ── Styles ───────────────────────────────────────────────────────────────────

function getStyles(theme: GrafanaTheme2) {
  const base = getSectionStyles(theme);
  return {
    ...base,
    containerItem: css`
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      margin-bottom: ${theme.spacing(1)};
      overflow: hidden;
    `,
    containerHeader: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(1, 2)};
      background: ${theme.colors.background.canvas};
      cursor: pointer;
      user-select: none;
    `,
    containerHeaderName: css`
      flex: 1;
      font-size: ${theme.typography.body.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.text.primary};
    `,
    containerToggle: css`
      color: ${theme.colors.text.secondary};
      font-size: 16px;
    `,
    dot: css`
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    `,
    containerBody: css`
      padding: ${theme.spacing(1.5, 2, 2, 2)};
      border-top: 1px solid ${theme.colors.border.weak};
    `,
    subLabel: css`
      font-size: ${theme.typography.body.fontSize};
      color: ${theme.colors.text.primary};
      margin: ${theme.spacing(1.5, 0, 0.75, 0)};
    `,
    envGrid: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(1.5, 3)};
    `,
    envItem: css`
      display: flex;
      flex-direction: column;
      min-width: 80px;
    `,
    envKey: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      font-family: monospace;
      margin-bottom: 2px;
    `,
    envValue: css`
      font-size: ${theme.typography.body.fontSize};
      color: ${theme.colors.text.primary};
      word-break: break-all;
    `,
    codeBlock: css`
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(1, 1.5)};
      color: ${theme.colors.text.primary};
      white-space: pre-wrap;
      line-height: 1.6;
    `,
    resourcesRow: css`
      display: flex;
      gap: ${theme.spacing(4)};
      flex-wrap: wrap;
    `,
    resourceGroup: css`
      flex: 1;
      min-width: 160px;
    `,
  };
}

// ── Sub-renderers ────────────────────────────────────────────────────────────

function ContainerItem({ container, styles }: { container: Container; styles: ReturnType<typeof getStyles> }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasReadyInfo = container.ready !== undefined && container.ready !== null;
  const ready = isReady(container.ready);

  const probeFields: Array<{ label: string; value?: string | number }> = [
    { label: 'Initial Delay (Seconds)', value: container.readinessProbe?.initialDelaySeconds },
    { label: 'Timeout (Seconds)', value: container.readinessProbe?.timeoutSeconds },
    { label: 'Probe Period (Seconds)', value: container.readinessProbe?.periodSeconds },
    { label: 'Success Threshold', value: container.readinessProbe?.successThreshold },
    { label: 'Failure Threshold', value: container.readinessProbe?.failureThreshold },
  ].filter((f) => f.value !== undefined && f.value !== null);

  const secCtx = container.securityContext;
  const secFields: Array<{ label: string; value: string }> = [
    secCtx?.runAsUser !== undefined ? { label: 'Run as User', value: String(secCtx.runAsUser) } : null,
    secCtx?.runAsGroup !== undefined ? { label: 'Run as Group', value: String(secCtx.runAsGroup) } : null,
    secCtx?.runAsNonRoot !== undefined ? { label: 'Run as Non-Root', value: String(secCtx.runAsNonRoot) } : null,
    secCtx?.capabilities?.drop?.length
      ? { label: 'Dropped Capabilities', value: secCtx.capabilities.drop.join(', ') }
      : null,
    secCtx?.readOnlyRootFilesystem !== undefined
      ? { label: 'Read Only Filesystem', value: String(secCtx.readOnlyRootFilesystem) }
      : null,
    secCtx?.allowPrivilegeEscalation !== undefined
      ? { label: 'Allow Privilege Escalation', value: String(secCtx.allowPrivilegeEscalation) }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const commandLines = [
    ...(container.command ?? []),
    ...(container.args ?? []),
  ];

  const probeUri = container.readinessProbe?.httpGet
    ? `http://[host]:${container.readinessProbe.httpGet.port}${container.readinessProbe.httpGet.path ?? ''}`
    : undefined;

  const execCommands = container.readinessProbe?.exec?.command;

  const hasLimits = container.limits?.cpu || container.limits?.memory;
  const hasRequests = container.requests?.cpu || container.requests?.memory;

  return (
    <div className={styles.containerItem}>
      <div className={styles.containerHeader} onClick={() => setCollapsed((c) => !c)}>
        {hasReadyInfo && (
          <div
            className={styles.dot}
            style={{ backgroundColor: ready ? '#73BF69' : '#F2495C' }}
          />
        )}
        <span className={styles.containerHeaderName}>{container.name}</span>
        <span className={styles.containerToggle}>{collapsed ? '+' : '−'}</span>
      </div>

      {!collapsed && (
        <div className={styles.containerBody}>
          {/* Image */}
          {container.image && (
            <div className={styles.field} style={{ marginBottom: '12px' }}>
              <span className={styles.fieldLabel}>Image</span>
              <span className={styles.fieldValue}>{container.image}</span>
            </div>
          )}

          {/* Status */}
          <div className={styles.subLabel}>Status</div>
          <div className={styles.fieldsRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Ready</span>
              <span className={styles.fieldValue}>{boolStr(container.ready)}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Started</span>
              <span className={styles.fieldValue}>{boolStr(container.started)}</span>
            </div>
            {container.reason && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Reason</span>
                <span className={styles.fieldValue}>{container.reason}</span>
              </div>
            )}
          </div>

          {/* Environment Variables */}
          {container.env && container.env.length > 0 && (
            <>
              <div className={styles.subLabel}>Environment Variables</div>
              <div className={styles.envGrid}>
                {container.env.map((ev, i) => (
                  <div key={i} className={styles.envItem}>
                    <span className={styles.envKey}>{ev.name}</span>
                    <span className={styles.envValue}>{ev.value ?? ''}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Commands / Args */}
          {commandLines.length > 0 && (
            <>
              <div className={styles.subLabel}>
                {container.command && container.command.length > 0 ? 'Commands' : 'Arguments'}
              </div>
              <div className={styles.codeBlock}>{commandLines.join('\n')}</div>
            </>
          )}

          {/* Mounts */}
          {container.mounts && container.mounts.length > 0 && (
            <>
              <div className={styles.subLabel}>Mounts</div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Read Only</th>
                    <th className={styles.th}>Mount Path</th>
                    <th className={styles.th}>Sub Path</th>
                    <th className={styles.th}>Source Type</th>
                    <th className={styles.th}>Source Name</th>
                  </tr>
                </thead>
                <tbody>
                  {container.mounts.map((m, i) => (
                    <tr key={i}>
                      <td className={styles.td}>{m.name}</td>
                      <td className={styles.td}>{String(m.readOnly ?? false)}</td>
                      <td className={styles.td}>{m.mountPath ?? '-'}</td>
                      <td className={styles.tdMuted}>{m.subPath || '-'}</td>
                      <td className={styles.td}>{m.type ?? m.sourceType ?? '-'}</td>
                      <td className={styles.td}>{m.sourceName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Security Context */}
          {secFields.length > 0 && (
            <>
              <div className={styles.subLabel}>Security Context</div>
              <div className={styles.fieldsRow}>
                {secFields.map(({ label, value }) => (
                  <div key={label} className={styles.field}>
                    <span className={styles.fieldLabel}>{label}</span>
                    <span className={styles.fieldValue}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Readiness Probe */}
          {container.readinessProbe && (
            <>
              <div className={styles.subLabel}>Readiness Probe</div>
              <div className={styles.fieldsRow}>
                {probeFields.map(({ label, value }) => (
                  <div key={label} className={styles.field}>
                    <span className={styles.fieldLabel}>{label}</span>
                    <span className={styles.fieldValue}>{String(value)}</span>
                  </div>
                ))}
                {probeUri && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>HTTP Healthcheck URI</span>
                    <span className={styles.fieldValue}>{probeUri}</span>
                  </div>
                )}
              </div>
              {execCommands && execCommands.length > 0 && (
                <>
                  <div className={styles.sectionLabel}>Exec Commands</div>
                  <div className={styles.codeBlock}>{execCommands.join('\n')}</div>
                </>
              )}
            </>
          )}

          {/* Resource Limits + Requests */}
          {(hasLimits || hasRequests) && (
            <div className={styles.resourcesRow} style={{ marginTop: '12px' }}>
              {hasLimits && (
                <div className={styles.resourceGroup}>
                  <div className={styles.subLabel}>Resource Limits</div>
                  <div className={styles.chipsRow}>
                    {container.limits?.cpu && (
                      <span className={styles.mutedChip}>cpu: {container.limits.cpu}</span>
                    )}
                    {container.limits?.memory && (
                      <span className={styles.mutedChip}>memory: {container.limits.memory}</span>
                    )}
                  </div>
                </div>
              )}
              {hasRequests && (
                <div className={styles.resourceGroup}>
                  <div className={styles.subLabel}>Resource Requests</div>
                  <div className={styles.chipsRow}>
                    {container.requests?.cpu && (
                      <span className={styles.mutedChip}>cpu: {container.requests.cpu}</span>
                    )}
                    {container.requests?.memory && (
                      <span className={styles.mutedChip}>memory: {container.requests.memory}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Scene object ─────────────────────────────────────────────────────────────

function ContainersRenderer({ model }: SceneComponentProps<ContainersSection>) {
  const styles = useStyles2(getStyles);

  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();
  const containers = extractContainers(data);

  if (containers.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection title="Containers">
      {containers.map((c) => (
        <ContainerItem key={c.name} container={c} styles={styles} />
      ))}
    </CollapsibleSection>
  );
}

export class ContainersSection extends SceneObjectBase<SceneObjectState> {
  static Component = ContainersRenderer;
}
