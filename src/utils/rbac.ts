import { getBackendSrv } from '@grafana/runtime';

export interface RbacPermissions {
  role: string;
  canWrite: boolean;
  actions: string[];
}

export interface WriteResponse {
  success: boolean;
  message: string;
}

const FALLBACK: RbacPermissions = { role: 'Viewer', canWrite: false, actions: [] };

function resourceUrl(dsUid: string, path: string): string {
  return `/api/datasources/uid/${dsUid}/resources/${path}`;
}

export async function fetchPermissions(dsUid: string): Promise<RbacPermissions> {
  try {
    return await getBackendSrv().get(resourceUrl(dsUid, 'rbac/permissions'));
  } catch {
    return FALLBACK;
  }
}

export async function scale(
  dsUid: string,
  namespace: string,
  resource: string,
  name: string,
  replicas: number
): Promise<WriteResponse> {
  return getBackendSrv().post(resourceUrl(dsUid, 'scale'), {
    namespace,
    resource,
    name,
    replicas,
  });
}

export async function restart(
  dsUid: string,
  namespace: string,
  resource: string,
  name: string
): Promise<WriteResponse> {
  return getBackendSrv().post(resourceUrl(dsUid, 'restart'), {
    namespace,
    resource,
    name,
  });
}

export async function deletePod(
  dsUid: string,
  namespace: string,
  name: string
): Promise<WriteResponse> {
  return getBackendSrv().post(resourceUrl(dsUid, 'delete'), {
    namespace,
    resource: 'pods',
    name,
  });
}
