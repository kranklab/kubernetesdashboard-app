import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { RbacPermissions, scale, restart, deletePod, WriteResponse } from '../../utils/rbac';

interface Props {
  dsUid: string;
  permissions: RbacPermissions;
  namespace: string;
  resource: string;
  name: string;
  currentReplicas?: number;
  onActionComplete?: (message: string, success: boolean) => void;
}

const SCALABLE = new Set(['deployments', 'statefulsets', 'replicasets']);
const RESTARTABLE = new Set(['deployments', 'statefulsets', 'daemonsets']);
const DELETABLE = new Set(['pods']);

function getActionStyles(theme: GrafanaTheme2) {
  return {
    row: css`
      display: flex;
      gap: ${theme.spacing(0.5)};
      margin-top: ${theme.spacing(1)};
    `,
    btn: css`
      padding: 2px 8px;
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.canvas};
      color: ${theme.colors.text.primary};
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      &:hover:not(:disabled) {
        background: ${theme.colors.background.secondary};
        border-color: ${theme.colors.border.strong};
      }
      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    `,
    btnDanger: css`
      padding: 2px 8px;
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.error.border};
      background: ${theme.colors.error.transparent};
      color: ${theme.colors.error.text};
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      &:hover:not(:disabled) {
        background: ${theme.colors.error.main};
        color: ${theme.colors.error.contrastText};
      }
      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    `,
    overlay: css`
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    modal: css`
      background: ${theme.colors.background.primary};
      border: 1px solid ${theme.colors.border.medium};
      border-radius: ${theme.shape.radius.default};
      padding: ${theme.spacing(3)};
      min-width: 360px;
      max-width: 480px;
      box-shadow: ${theme.shadows.z3};
    `,
    modalTitle: css`
      font-size: ${theme.typography.h5.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      margin-bottom: ${theme.spacing(2)};
    `,
    modalBody: css`
      font-size: ${theme.typography.body.fontSize};
      margin-bottom: ${theme.spacing(2)};
      color: ${theme.colors.text.secondary};
    `,
    modalInput: css`
      width: 100%;
      padding: ${theme.spacing(0.75, 1.5)};
      border-radius: ${theme.shape.radius.default};
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.secondary};
      color: ${theme.colors.text.primary};
      font-size: ${theme.typography.body.fontSize};
      margin-bottom: ${theme.spacing(2)};
      outline: none;
      &:focus {
        border-color: ${theme.colors.primary.border};
      }
    `,
    modalActions: css`
      display: flex;
      justify-content: flex-end;
      gap: ${theme.spacing(1)};
    `,
  };
}

export function ResourceActions({
  dsUid,
  permissions,
  namespace,
  resource,
  name,
  currentReplicas,
  onActionComplete,
}: Props) {
  const styles = useStyles2(getActionStyles);
  const [modal, setModal] = useState<'scale' | 'restart' | 'delete' | null>(null);
  const [replicas, setReplicas] = useState<number>(currentReplicas ?? 1);
  const [deleteInput, setDeleteInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!permissions.canWrite) {
    return null;
  }

  const canScale = SCALABLE.has(resource) && permissions.actions.includes('scale');
  const canRestart = RESTARTABLE.has(resource) && permissions.actions.includes('restart');
  const canDelete = DELETABLE.has(resource) && permissions.actions.includes('delete');

  if (!canScale && !canRestart && !canDelete) {
    return null;
  }

  const exec = async (fn: () => Promise<WriteResponse>) => {
    setLoading(true);
    try {
      const res = await fn();
      onActionComplete?.(res.message, res.success);
    } catch (err: any) {
      onActionComplete?.(err?.message ?? 'Operation failed', false);
    } finally {
      setLoading(false);
      setModal(null);
      setDeleteInput('');
    }
  };

  return (
    <>
      <div
        className={styles.row}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {canScale && (
          <button className={styles.btn} onClick={() => setModal('scale')}>
            Scale
          </button>
        )}
        {canRestart && (
          <button className={styles.btn} onClick={() => setModal('restart')}>
            Restart
          </button>
        )}
        {canDelete && (
          <button className={styles.btnDanger} onClick={() => setModal('delete')}>
            Delete
          </button>
        )}
      </div>

      {modal && (
        <div
          className={styles.overlay}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!loading) {
              setModal(null);
              setDeleteInput('');
            }
          }}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {modal === 'scale' && (
              <>
                <div className={styles.modalTitle}>Scale {name}</div>
                <div className={styles.modalBody}>
                  Set replica count for <strong>{name}</strong> in <strong>{namespace}</strong>:
                </div>
                <input
                  className={styles.modalInput}
                  type="number"
                  min={0}
                  value={replicas}
                  onChange={(e) => setReplicas(parseInt(e.target.value, 10) || 0)}
                  style={{ width: 100 }}
                />
                <div className={styles.modalActions}>
                  <button className={styles.btn} onClick={() => setModal(null)} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    className={styles.btn}
                    disabled={loading}
                    onClick={() => exec(() => scale(dsUid, namespace, resource, name, replicas))}
                  >
                    {loading ? 'Scaling...' : 'Apply'}
                  </button>
                </div>
              </>
            )}
            {modal === 'restart' && (
              <>
                <div className={styles.modalTitle}>Restart {name}</div>
                <div className={styles.modalBody}>
                  This will trigger a rolling restart of {resource.slice(0, -1)} &quot;{name}&quot; in
                  namespace &quot;{namespace}&quot;.
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.btn} onClick={() => setModal(null)} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    className={styles.btn}
                    disabled={loading}
                    onClick={() => exec(() => restart(dsUid, namespace, resource, name))}
                  >
                    {loading ? 'Restarting...' : 'Restart'}
                  </button>
                </div>
              </>
            )}
            {modal === 'delete' && (
              <>
                <div className={styles.modalTitle}>Delete pod {name}</div>
                <div className={styles.modalBody}>
                  Type the pod name <strong>{name}</strong> to confirm deletion:
                </div>
                <input
                  className={styles.modalInput}
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={name}
                />
                <div className={styles.modalActions}>
                  <button className={styles.btn} onClick={() => setModal(null)} disabled={loading}>
                    Cancel
                  </button>
                  <button
                    className={styles.btnDanger}
                    disabled={loading || deleteInput !== name}
                    onClick={() => exec(() => deletePod(dsUid, namespace, name))}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
