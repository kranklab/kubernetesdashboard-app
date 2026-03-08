import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles } from './CollapsibleSection';

interface Event {
  name: string;
  reason: string;
  message: string;
  source: string;
  subObject: string;
  count: number;
  firstSeen?: number;
  lastSeen?: number;
}

function extractEvents(data: any): Event[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find(
    (f: DataFrame) => f.name === 'events'
  );
  if (!frame || !frame.fields.length) {
    return [];
  }

  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }

  const reasonF = col('Reason');
  const messageF = col('Message');
  const sourceF = col('Source');
  const subObjF = col('Sub Object');
  const countF = col('Count');
  const firstSeenF = col('First Seen');
  const lastSeenF = col('Last Seen');

  const events: Event[] = [];
  for (let i = 0; i < count; i++) {
    events.push({
      name: (nameF?.values as any)[i] ?? '',
      reason: (reasonF?.values as any)?.[i] ?? '',
      message: (messageF?.values as any)?.[i] ?? '',
      source: (sourceF?.values as any)?.[i] ?? '',
      subObject: (subObjF?.values as any)?.[i] ?? '',
      count: (countF?.values as any)?.[i] ?? 0,
      firstSeen: (firstSeenF?.values as any)?.[i] ?? undefined,
      lastSeen: (lastSeenF?.values as any)?.[i] ?? undefined,
    });
  }
  return events;
}

function formatTime(ts: number | undefined): string {
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
  return getSectionStyles(theme);
}

function EventsRenderer({ model }: SceneComponentProps<EventsSection>) {
  const styles = useStyles2(getStyles);

  const dataNode = sceneGraph.getData(model);
  const { data } = dataNode.useState();
  const events = extractEvents(data);

  return (
    <CollapsibleSection title="Events">
      {events.length === 0 ? (
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
              <th className={styles.th}>Reason</th>
              <th className={styles.th}>Message</th>
              <th className={styles.th}>Source</th>
              <th className={styles.th}>Sub-object</th>
              <th className={styles.th}>Count</th>
              <th className={styles.th}>First seen</th>
              <th className={styles.th}>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td className={styles.td}>{e.name}</td>
                <td className={styles.td}>{e.reason}</td>
                <td className={styles.td}>{e.message}</td>
                <td className={styles.tdMuted}>{e.source}</td>
                <td className={styles.tdMuted}>{e.subObject}</td>
                <td className={styles.td}>{e.count}</td>
                <td className={styles.tdMuted}>{formatTime(e.firstSeen)}</td>
                <td className={styles.tdMuted}>{formatTime(e.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleSection>
  );
}

export class EventsSection extends SceneObjectBase<SceneObjectState> {
  static Component = EventsRenderer;
}
