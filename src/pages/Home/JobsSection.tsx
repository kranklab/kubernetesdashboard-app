import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, DataFrame, dateTime } from '@grafana/data';
import { CollapsibleSection, getSectionStyles, labelColor } from './CollapsibleSection';

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

interface JobRow {
  name: string;
  namespace: string;
  images: string[];
  labels: Record<string, string>;
  pods: string;
  created: any;
}

function extractJobs(data: any, frameName: string): JobRow[] {
  if (!data?.series?.length) {
    return [];
  }
  const frame: DataFrame | undefined = data.series.find((f: DataFrame) => f.name === frameName);
  if (!frame?.fields?.length) {
    return [];
  }
  const col = (name: string) => frame.fields.find((f) => f.name === name);
  const nameF = col('Name');
  const count = nameF?.values.length ?? 0;
  if (count === 0) {
    return [];
  }
  const results: JobRow[] = [];
  for (let i = 0; i < count; i++) {
    const get = (n: string) => (col(n)?.values as any)?.[i];
    results.push({
      name: get('Name') ?? '',
      namespace: get('Namespace') ?? '',
      images: parseJson(get('Images')) ?? [],
      labels: parseJson(get('Labels')) ?? {},
      pods: get('Pods') ?? '',
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
  return getSectionStyles(theme);
}

function JobTable({ jobs, styles }: { jobs: JobRow[]; styles: ReturnType<typeof getStyles> }) {
  if (jobs.length === 0) {
    return (
      <div className={styles.emptyState}>
        There is nothing to display here
        <br />
        No resources found.
      </div>
    );
  }
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Name</th>
          <th className={styles.th}>Images</th>
          <th className={styles.th}>Labels</th>
          <th className={styles.th}>Pods</th>
          <th className={styles.th}>Created</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job, i) => (
          <tr key={i}>
            <td className={styles.td}>{job.name}</td>
            <td className={styles.td}>
              <div className={styles.chipsRow}>
                {job.images.map((img, j) => (
                  <span key={j} className={styles.mutedChip}>
                    {img}
                  </span>
                ))}
              </div>
            </td>
            <td className={styles.td}>
              <div className={styles.chipsRow}>
                {Object.entries(job.labels).map(([k, v], j) => (
                  <span key={k} className={styles.chip} style={{ backgroundColor: labelColor(j) }}>
                    {k}: {v}
                  </span>
                ))}
              </div>
            </td>
            <td className={styles.td}>{job.pods}</td>
            <td className={styles.td}>{formatAge(job.created)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function JobsSectionRenderer({ model }: SceneComponentProps<JobsSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();

  const hasFrame =
    data?.series?.some((f: DataFrame) => f.name === 'active_jobs') ||
    data?.series?.some((f: DataFrame) => f.name === 'inactive_jobs');

  if (!hasFrame) {
    return null;
  }

  const activeJobs = extractJobs(data, 'active_jobs');
  const inactiveJobs = extractJobs(data, 'inactive_jobs');

  return (
    <>
      <CollapsibleSection title="Active Jobs" defaultCollapsed={activeJobs.length === 0}>
        <JobTable jobs={activeJobs} styles={styles} />
      </CollapsibleSection>
      <CollapsibleSection title="Inactive Jobs" defaultCollapsed={inactiveJobs.length === 0}>
        <JobTable jobs={inactiveJobs} styles={styles} />
      </CollapsibleSection>
    </>
  );
}

export class JobsSection extends SceneObjectBase<SceneObjectState> {
  static Component = JobsSectionRenderer;
}
