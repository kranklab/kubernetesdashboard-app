import React from 'react';
import { SceneObjectBase, SceneObjectState, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { CollapsibleSection, getSectionStyles, labelColor } from './CollapsibleSection';
import { getFieldValue, parseJsonArray, getMetaFrame, parseJsonOrObject } from './MetadataHeader';
import { PLUGIN_BASE_URL } from '../../constants';

function getStyles(theme: GrafanaTheme2) {
  return getSectionStyles(theme);
}

function FieldsRow({
  fields,
  styles,
}: {
  fields: Array<{ label: string; value: any }>;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <div className={styles.fieldsRow}>
      {fields.map(({ label, value }) => (
        <div key={label} className={styles.field}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.fieldValue}>{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function parseJsonMap(val: any): Record<string, string> | undefined {
  if (!val) {
    return undefined;
  }
  if (typeof val === 'object' && !Array.isArray(val)) {
    return val;
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function SelectorChips({ selectorRaw, styles }: { selectorRaw: any; styles: ReturnType<typeof getStyles> }) {
  const selector = parseJsonMap(selectorRaw);
  if (!selector || Object.keys(selector).length === 0) {
    return null;
  }
  return (
    <div style={{ marginBottom: '8px' }}>
      <div className={styles.sectionLabel}>Selector</div>
      <div className={styles.chipsRow}>
        {Object.entries(selector).map(([k, v], i) => (
          <span key={k} className={styles.chip} style={{ backgroundColor: labelColor(i) }}>
            {k}: {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function ImagesChips({ imagesRaw, styles }: { imagesRaw: any; styles: ReturnType<typeof getStyles> }) {
  const images = parseJsonArray(imagesRaw);
  if (!images || images.length === 0) {
    return null;
  }
  return (
    <div style={{ marginBottom: '8px' }}>
      <div className={styles.sectionLabel}>Images</div>
      <div className={styles.chipsRow}>
        {images.map((img: string, i: number) => (
          <span key={i} className={styles.mutedChip}>
            {img}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResourceInfoRenderer({ model }: SceneComponentProps<ResourceInfoSection>) {
  const styles = useStyles2(getStyles);
  const { data } = sceneGraph.getData(model).useState();
  const frame = getMetaFrame(data);
  if (!frame) {
    return null;
  }

  // Deployment-specific fields — if Strategy is present we're in deployment view
  const strategy = getFieldValue(frame, 'Strategy');

  if (strategy !== undefined) {
    const replicas = getFieldValue(frame, 'Replicas');
    const available = getFieldValue(frame, 'Available');
    const updated = getFieldValue(frame, 'Updated');
    const minReadySeconds = getFieldValue(frame, 'Min Ready Seconds');
    const revisionHistoryLimit = getFieldValue(frame, 'Revision History Limit');
    const selector = getFieldValue(frame, 'Selector');
    const maxSurge = getFieldValue(frame, 'Max Surge');
    const maxUnavailable = getFieldValue(frame, 'Max Unavailable');

    const infoFields = [
      { label: 'Strategy', value: strategy },
      { label: 'Min Ready Seconds', value: minReadySeconds },
      { label: 'Revision History Limit', value: revisionHistoryLimit },
      { label: 'Selector', value: selector },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

    const rollingFields = [
      { label: 'Max Surge', value: maxSurge },
      { label: 'Max Unavailable', value: maxUnavailable },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

    const podsFields = [
      { label: 'Updated', value: updated },
      { label: 'Total', value: replicas },
      { label: 'Available', value: available },
    ].filter((f) => f.value !== undefined && f.value !== null);

    if (infoFields.length === 0 && rollingFields.length === 0 && podsFields.length === 0) {
      return null;
    }

    return (
      <>
        {infoFields.length > 0 && (
          <CollapsibleSection title="Resource information">
            <FieldsRow fields={infoFields} styles={styles} />
          </CollapsibleSection>
        )}
        {rollingFields.length > 0 && (
          <CollapsibleSection title="Rolling update strategy">
            <FieldsRow fields={rollingFields} styles={styles} />
          </CollapsibleSection>
        )}
        {podsFields.length > 0 && (
          <CollapsibleSection title="Pods status">
            <FieldsRow fields={podsFields} styles={styles} />
          </CollapsibleSection>
        )}
      </>
    );
  }

  // DaemonSet / ReplicaSet view (has Kind + Selector + Images + Number Running/Desired)
  const kind = getFieldValue(frame, 'Kind');

  if (kind === 'DaemonSet' || kind === 'ReplicaSet') {
    const selectorRaw = getFieldValue(frame, 'Selector');
    const imagesRaw = getFieldValue(frame, 'Images');
    const numberRunning = getFieldValue(frame, 'Number Running');
    const numberDesired = getFieldValue(frame, 'Number Desired');
    const podsFields = [
      { label: 'Running', value: numberRunning },
      { label: 'Desired', value: numberDesired },
    ].filter((f) => f.value !== undefined && f.value !== null);
    return (
      <>
        <CollapsibleSection title="Resource information">
          <SelectorChips selectorRaw={selectorRaw} styles={styles} />
          <ImagesChips imagesRaw={imagesRaw} styles={styles} />
        </CollapsibleSection>
        {podsFields.length > 0 && (
          <CollapsibleSection title="Pods status">
            <FieldsRow fields={podsFields} styles={styles} />
          </CollapsibleSection>
        )}
      </>
    );
  }

  if (kind === 'StatefulSet') {
    const imagesRaw = getFieldValue(frame, 'Images');
    const numberRunning = getFieldValue(frame, 'Number Running');
    const numberDesired = getFieldValue(frame, 'Number Desired');
    const podsFields = [
      { label: 'Running', value: numberRunning },
      { label: 'Desired', value: numberDesired },
    ].filter((f) => f.value !== undefined && f.value !== null);
    return (
      <>
        <CollapsibleSection title="Resource information">
          <ImagesChips imagesRaw={imagesRaw} styles={styles} />
        </CollapsibleSection>
        {podsFields.length > 0 && (
          <CollapsibleSection title="Pods status">
            <FieldsRow fields={podsFields} styles={styles} />
          </CollapsibleSection>
        )}
      </>
    );
  }

  if (kind === 'Job') {
    const completions = getFieldValue(frame, 'Completions');
    const parallelism = getFieldValue(frame, 'Parallelism');
    const imagesRaw = getFieldValue(frame, 'Images');
    const succeeded = getFieldValue(frame, 'Succeeded');
    const numberDesired = getFieldValue(frame, 'Number Desired');
    const infoFields = [
      { label: 'Completions', value: completions },
      { label: 'Parallelism', value: parallelism },
    ].filter((f) => f.value !== undefined && f.value !== null);
    const podsFields = [
      { label: 'Succeeded', value: succeeded },
      { label: 'Desired', value: numberDesired },
    ].filter((f) => f.value !== undefined && f.value !== null);
    return (
      <>
        <CollapsibleSection title="Resource information">
          <FieldsRow fields={infoFields} styles={styles} />
          <ImagesChips imagesRaw={imagesRaw} styles={styles} />
        </CollapsibleSection>
        {podsFields.length > 0 && (
          <CollapsibleSection title="Pods status">
            <FieldsRow fields={podsFields} styles={styles} />
          </CollapsibleSection>
        )}
      </>
    );
  }

  if (kind === 'CronJob') {
    const schedule = getFieldValue(frame, 'Schedule');
    const activeJobs = getFieldValue(frame, 'Active Jobs');
    const suspend = getFieldValue(frame, 'Suspend');
    const lastSchedule = getFieldValue(frame, 'Last Schedule');
    const concurrencyPolicy = getFieldValue(frame, 'Concurrency Policy');
    const startingDeadlineSeconds = getFieldValue(frame, 'Starting Deadline Seconds');
    const infoFields = [
      { label: 'Schedule', value: schedule },
      { label: 'Active Jobs', value: activeJobs },
      { label: 'Suspend', value: suspend !== undefined ? String(suspend) : undefined },
      { label: 'Last Schedule', value: lastSchedule ? String(lastSchedule) : undefined },
      { label: 'Concurrency Policy', value: concurrencyPolicy },
      { label: 'Starting Deadline Seconds', value: startingDeadlineSeconds },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');
    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={infoFields} styles={styles} />
      </CollapsibleSection>
    );
  }

  if (kind === 'Service') {
    const serviceType = getFieldValue(frame, 'Type');
    const clusterIP = getFieldValue(frame, 'Cluster IP');
    const sessionAffinity = getFieldValue(frame, 'Session Affinity');
    const selectorRaw = getFieldValue(frame, 'Selector');
    const infoFields = [
      { label: 'Type', value: serviceType },
      { label: 'Cluster IP', value: clusterIP },
      { label: 'Session Affinity', value: sessionAffinity },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');
    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={infoFields} styles={styles} />
        <SelectorChips selectorRaw={selectorRaw} styles={styles} />
      </CollapsibleSection>
    );
  }

  if (kind === 'Ingress') {
    const ingressClassName = getFieldValue(frame, 'Ingress Class Name');
    const endpointsRaw = getFieldValue(frame, 'Endpoints');
    const endpoints: string[] = parseJsonArray(endpointsRaw) ?? [];
    return (
      <CollapsibleSection title="Resource information">
        {ingressClassName && (
          <div className={styles.fieldsRow}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Ingress Class Name</span>
              <span className={styles.fieldValue}>{ingressClassName}</span>
            </div>
          </div>
        )}
        {endpoints.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div className={styles.sectionLabel}>Endpoints</div>
            <div className={styles.chipsRow}>
              {endpoints.map((ep: string, i: number) => (
                <span key={i} className={styles.mutedChip}>
                  {ep}
                </span>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>
    );
  }

  if (kind === 'IngressClass') {
    const controller = getFieldValue(frame, 'Controller');
    if (!controller) {
      return null;
    }
    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={[{ label: 'Controller', value: controller }]} styles={styles} />
      </CollapsibleSection>
    );
  }

  if (kind === 'PersistentVolumeClaim') {
    const status = getFieldValue(frame, 'Status');
    const storageClass = getFieldValue(frame, 'Storage Class');
    const volumeName = getFieldValue(frame, 'Volume Name');
    const capacity = getFieldValue(frame, 'Capacity');
    const accessModesRaw = getFieldValue(frame, 'Access Modes');
    const accessModes: string[] = parseJsonArray(accessModesRaw) ?? [];

    const infoFields = [
      { label: 'Status', value: status },
      { label: 'Storage Class', value: storageClass },
      { label: 'Capacity', value: capacity },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

    return (
      <CollapsibleSection title="Resource information">
        <div className={styles.fieldsRow}>
          {infoFields.map(({ label, value }) => (
            <div key={label} className={styles.field}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{String(value)}</span>
            </div>
          ))}
          {volumeName && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Volume Name</span>
              <a
                href={`${PLUGIN_BASE_URL}/cluster/pv/${volumeName}`}
                style={{ color: 'rgb(110, 159, 255)' }}
              >
                {volumeName}
              </a>
            </div>
          )}
        </div>
        {accessModes.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>Access Modes</div>
            <div className={styles.chipsRow}>
              {accessModes.map((m, i) => (
                <span key={i} className={styles.mutedChip}>{m}</span>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>
    );
  }

  if (kind === 'StorageClass') {
    const provisioner = getFieldValue(frame, 'Provisioner');
    const reclaimPolicy = getFieldValue(frame, 'Reclaim Policy');
    const parametersRaw = getFieldValue(frame, 'Parameters');
    const parameters = parseJsonOrObject(parametersRaw) ?? {};

    const infoFields = [
      { label: 'Provisioner', value: provisioner },
      { label: 'Reclaim Policy', value: reclaimPolicy },
      ...Object.entries(parameters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => ({ label: k, value: String(v) })),
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

    if (infoFields.length === 0) {
      return null;
    }

    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={infoFields} styles={styles} />
      </CollapsibleSection>
    );
  }

  if (kind === 'Namespace') {
    const status = getFieldValue(frame, 'Status');
    if (!status) {
      return null;
    }
    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={[{ label: 'Status', value: status }]} styles={styles} />
      </CollapsibleSection>
    );
  }

  if (kind === 'NetworkPolicy') {
    const podSelectorRaw = getFieldValue(frame, 'Pod Selector');
    const policyTypesRaw = getFieldValue(frame, 'Policy Types');
    const policyTypes: string[] = parseJsonArray(policyTypesRaw) ??
      (typeof policyTypesRaw === 'string' && policyTypesRaw ? [policyTypesRaw] : []);
    return (
      <CollapsibleSection title="Resource information">
        {podSelectorRaw && (
          <div style={{ marginBottom: '8px' }}>
            <div className={styles.sectionLabel}>Pod Selector</div>
            <div className={styles.chipsRow}>
              <span className={styles.mutedChip}>{String(podSelectorRaw)}</span>
            </div>
          </div>
        )}
        {policyTypes.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>Policy Types</div>
            <div className={styles.chipsRow}>
              {policyTypes.map((t, i) => (
                <span key={i} className={styles.mutedChip}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>
    );
  }

  if (kind === 'PersistentVolume') {
    const status = getFieldValue(frame, 'Status');
    const claim = getFieldValue(frame, 'Claim');
    const claimNamespace = getFieldValue(frame, 'Claim Namespace');
    const claimName = getFieldValue(frame, 'Claim Name');
    const reclaimPolicy = getFieldValue(frame, 'Reclaim Policy');
    const storageClass = getFieldValue(frame, 'Storage Class');
    const accessModesRaw = getFieldValue(frame, 'Access Modes');
    const accessModes: string[] = parseJsonArray(accessModesRaw) ?? [];

    const infoFields = [
      { label: 'Status', value: status },
      { label: 'Reclaim policy', value: reclaimPolicy },
      { label: 'Storage class', value: storageClass },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

    return (
      <CollapsibleSection title="Resource information">
        <div className={styles.fieldsRow}>
          {infoFields.map(({ label, value }) => (
            <div key={label} className={styles.field}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{String(value)}</span>
            </div>
          ))}
          {claim && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Claim</span>
              <a
                href={`${PLUGIN_BASE_URL}/config-storage/pvc/${claimNamespace}/${claimName}`}
                style={{ color: 'rgb(110, 159, 255)' }}
              >
                {claim}
              </a>
            </div>
          )}
          {accessModes.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Access modes</span>
              <span className={styles.fieldValue}>{accessModes.join(', ')}</span>
            </div>
          )}
        </div>
      </CollapsibleSection>
    );
  }

  if (kind === 'ClusterRoleBinding' || kind === 'RoleBinding') {
    const roleRef = getFieldValue(frame, 'Role Reference');
    const roleRefKind = getFieldValue(frame, 'Role Ref Kind');
    if (!roleRef) {
      return null;
    }
    const clusterRoleUrl = `${PLUGIN_BASE_URL}/cluster/clusterrole/${roleRef}`;
    const roleUrl = roleRefKind === 'ClusterRole' ? clusterRoleUrl : undefined;
    return (
      <CollapsibleSection title="Resource information">
        <div style={{ marginBottom: '8px' }}>
          <div className={styles.sectionLabel}>Role Reference</div>
          {roleUrl ? (
            <a href={roleUrl} style={{ color: 'rgb(110, 159, 255)', fontSize: 'inherit' }}>{roleRef}</a>
          ) : (
            <span className={styles.fieldValue}>{roleRef}</span>
          )}
        </div>
      </CollapsibleSection>
    );
  }

  if (kind === 'CustomResourceDefinition') {
    const version = getFieldValue(frame, 'Version');
    const scope = getFieldValue(frame, 'Scope');
    const group = getFieldValue(frame, 'Group');
    const subresources = getFieldValue(frame, 'Subresources');
    const fields = [
      { label: 'Version', value: version },
      { label: 'Scope', value: scope },
      { label: 'Group', value: group },
      { label: 'Subresources', value: subresources },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '' && f.value !== '-');
    if (fields.length === 0) {
      return null;
    }
    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={fields} styles={styles} />
      </CollapsibleSection>
    );
  }

  if (kind === 'Node') {
    const internalIP = getFieldValue(frame, 'Internal IP');
    const externalIP = getFieldValue(frame, 'External IP');
    const hostname = getFieldValue(frame, 'Hostname');
    const fields = [
      { label: 'Internal IP', value: internalIP },
      { label: 'External IP', value: externalIP },
      { label: 'Hostname', value: hostname },
    ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');
    if (fields.length === 0) {
      return null;
    }
    return (
      <CollapsibleSection title="Resource information">
        <FieldsRow fields={fields} styles={styles} />
      </CollapsibleSection>
    );
  }

  // Pod view
  const node = getFieldValue(frame, 'Node');
  const status = getFieldValue(frame, 'Status');
  const ip = getFieldValue(frame, 'IP');
  const qosClass = getFieldValue(frame, 'QoS Class');
  const restarts = getFieldValue(frame, 'Restarts');
  const serviceAccount = getFieldValue(frame, 'Service Account');
  const imagePullSecretsRaw = getFieldValue(frame, 'Image Pull Secrets');

  let imagePullSecrets: string[] | undefined;
  const parsed = parseJsonArray(imagePullSecretsRaw);
  if (parsed) {
    imagePullSecrets = parsed.map((s: any) =>
      typeof s === 'string' ? s : s?.name ?? JSON.stringify(s)
    );
  } else if (typeof imagePullSecretsRaw === 'string' && imagePullSecretsRaw.length > 0) {
    imagePullSecrets = [imagePullSecretsRaw];
  }

  const podFields = [
    { label: 'Node', value: node },
    { label: 'Status', value: status },
    { label: 'IP', value: ip },
    { label: 'QoS Class', value: qosClass },
    { label: 'Restarts', value: restarts },
    { label: 'Service Account', value: serviceAccount },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  if (podFields.length === 0 && (!imagePullSecrets || imagePullSecrets.length === 0)) {
    return null;
  }

  return (
    <CollapsibleSection title="Resource information">
      <FieldsRow fields={podFields} styles={styles} />
      {imagePullSecrets && imagePullSecrets.length > 0 && (
        <div>
          <div className={styles.sectionLabel}>Image Pull Secrets</div>
          <div className={styles.chipsRow}>
            {imagePullSecrets.map((s) => (
              <span key={s} className={styles.mutedChip}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

export class ResourceInfoSection extends SceneObjectBase<SceneObjectState> {
  static Component = ResourceInfoRenderer;
}
