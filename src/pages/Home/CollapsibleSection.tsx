import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

export function getSectionStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      margin-bottom: ${theme.spacing(1)};
    `,
    header: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${theme.spacing(1, 2)};
      cursor: pointer;
      user-select: none;
    `,
    title: css`
      font-size: ${theme.typography.body.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
      color: ${theme.colors.text.primary};
    `,
    toggle: css`
      color: ${theme.colors.text.secondary};
      font-size: 16px;
      line-height: 1;
    `,
    body: css`
      padding: ${theme.spacing(1, 2, 2, 2)};
      border-top: 1px solid ${theme.colors.border.weak};
    `,
    fieldsRow: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(3)};
      margin-bottom: ${theme.spacing(1.5)};
    `,
    field: css`
      display: flex;
      flex-direction: column;
      min-width: 100px;
    `,
    fieldLabel: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      margin-bottom: 2px;
    `,
    fieldValue: css`
      font-size: ${theme.typography.body.fontSize};
      color: ${theme.colors.text.primary};
      word-break: break-all;
    `,
    sectionLabel: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      margin-bottom: ${theme.spacing(0.5)};
      margin-top: ${theme.spacing(0.5)};
    `,
    chipsRow: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(0.5)};
    `,
    chip: css`
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 2px;
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.background.primary};
      white-space: nowrap;
    `,
    mutedChip: css`
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 2px;
      font-size: ${theme.typography.bodySmall.fontSize};
      background: ${theme.colors.background.canvas};
      border: 1px solid ${theme.colors.border.medium};
      color: ${theme.colors.text.secondary};
      white-space: nowrap;
    `,
    emptyState: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
      text-align: center;
      padding: ${theme.spacing(2)};
    `,
    table: css`
      width: 100%;
      border-collapse: collapse;
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    th: css`
      text-align: left;
      color: ${theme.colors.text.secondary};
      padding: ${theme.spacing(0.5, 1)};
      border-bottom: 1px solid ${theme.colors.border.weak};
      font-weight: ${theme.typography.fontWeightRegular};
    `,
    td: css`
      color: ${theme.colors.text.primary};
      padding: ${theme.spacing(0.75, 1)};
      border-bottom: 1px solid ${theme.colors.border.weak};
      vertical-align: top;
    `,
    tdMuted: css`
      color: ${theme.colors.text.secondary};
      padding: ${theme.spacing(0.75, 1)};
      border-bottom: 1px solid ${theme.colors.border.weak};
    `,
    statusTrue: css`
      color: ${theme.colors.success.text};
    `,
    statusFalse: css`
      color: ${theme.colors.warning.text};
    `,
    link: css`
      color: ${theme.colors.text.link};
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    `,
  };
}

export const LABEL_COLORS = [
  '#5794F2',
  '#73BF69',
  '#F2CC0C',
  '#FF9830',
  '#FA6400',
  '#B877D9',
  '#8AB8FF',
];

export function labelColor(index: number): string {
  return LABEL_COLORS[index % LABEL_COLORS.length];
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
}: CollapsibleSectionProps) {
  const styles = useStyles2(getSectionStyles);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setCollapsed((c) => !c)}>
        <span className={styles.title}>{title}</span>
        <span className={styles.toggle}>{collapsed ? '+' : '−'}</span>
      </div>
      {!collapsed && <div className={styles.body}>{children}</div>}
    </div>
  );
}
