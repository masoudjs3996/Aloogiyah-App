import type { Endpoint, Resource, Row } from '../types';

export function availableActions(resource: Resource, endpoints: Endpoint[], record: Row) {
  return endpoints.filter(e => {
    if (resource.id !== 'AgriculturalOrder') return true;
    if (e.action.includes('Refund')) return record.refundStatus === 'Pending' && (!Array.isArray(record.allowedActions) || record.allowedActions.includes('CompleteRefund'));
    if (e.action.includes('/Action')) return Array.isArray(record.allowedActions) && record.allowedActions.some((action: string) => ['Approve', 'Reject', 'Ship'].includes(action));
    return true;
  });
}
