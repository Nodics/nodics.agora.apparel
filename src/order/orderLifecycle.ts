import type { AgoraRuntimeConfig } from '../runtime/config';
import { createOrderLifecycleRequest, listOrderLifecycleRequests, previewOrderLifecycleRequest, type OrderLifecyclePayload, type OrderLifecycleRequestType, type OrderLifecycleResponse } from '../api/commerceClient';

export const lifecycleTypes: readonly OrderLifecycleRequestType[] = Object.freeze(['CANCELLATION', 'RETURN', 'REFUND', 'EXCHANGE', 'REPLACEMENT', 'APPEAL']);

export const lifecycleReasonOptions: Readonly<Record<OrderLifecycleRequestType, readonly string[]>> = Object.freeze({
  CANCELLATION: ['CUSTOMER_CHANGED_MIND', 'FOUND_BETTER_PRICE', 'ORDERED_BY_MISTAKE'],
  RETURN: ['SIZE_OR_EXPECTATION_MISMATCH', 'DAMAGED_ITEM', 'WRONG_ITEM'],
  REFUND: ['REFUND_STATUS_REQUESTED', 'PARTIAL_REFUND_REQUESTED', 'DELAYED_REFUND'],
  EXCHANGE: ['SIZE_OR_EXPECTATION_MISMATCH', 'WRONG_ITEM', 'DAMAGED_ITEM'],
  REPLACEMENT: ['DAMAGED_ITEM', 'WRONG_ITEM', 'MISSING_PART'],
  APPEAL: ['CANCELLATION_REJECTED', 'RETURN_REJECTED', 'REFUND_DELAYED', 'REFUND_REJECTED'],
});

export const refundMethodOptions: readonly string[] = Object.freeze(['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'MANUAL_REVIEW']);
export const preferredResolutionOptions: readonly string[] = Object.freeze(['SHIP_REPLACEMENT', 'STORE_EXCHANGE', 'MANUAL_REVIEW']);

export const lifecycleFormGuidance: Readonly<Record<OrderLifecycleRequestType, string>> = Object.freeze({
  CANCELLATION: 'Choose cancellation reason and quantity before the order is released too far into fulfillment.',
  RETURN: 'Choose item quantity, return method and refund method. RMA and inspection details appear after submission.',
  REFUND: 'Use refund requests for delayed, partial or status-review cases. Some refunds require reconciliation.',
  EXCHANGE: 'Choose the original item, preferred resolution and replacement product when known.',
  REPLACEMENT: 'Use replacement when the same or equivalent product should be shipped after inspection.',
  APPEAL: 'Reference a rejected or delayed lifecycle case and explain why it should be reviewed.',
});

export function lifecycleReason(type: OrderLifecycleRequestType) {
  return lifecycleReasonOptions[type][0];
}

export interface LifecycleRequestInput {
  readonly reasonCode?: string;
  readonly quantity?: string;
  readonly returnMethod?: string;
  readonly refundMethod?: string;
  readonly comment?: string;
  readonly productCodes?: readonly string[];
  readonly replacementProductCode?: string;
  readonly preferredResolution?: string;
  readonly appealReferenceCode?: string;
  readonly appealReason?: string;
}

export function lifecyclePayload(
  orderCode: string,
  requestType: OrderLifecycleRequestType,
  input: LifecycleRequestInput = {},
): OrderLifecyclePayload {
  return {
    code: `${orderCode}:${requestType.toLowerCase()}:${Date.now()}`,
    requestType,
    reasonCode: input.reasonCode || lifecycleReason(requestType),
    policyVersion: '1',
    evidence: {
      source: 'nodics.agora.apparel',
      customerSubmitted: true,
      quantity: input.quantity,
      returnMethod: input.returnMethod,
      refundMethod: input.refundMethod,
      comment: input.comment,
      productCodes: input.productCodes,
      replacementProductCode: input.replacementProductCode,
      preferredResolution: input.preferredResolution,
      appealReferenceCode: input.appealReferenceCode,
      appealReason: input.appealReason,
    },
  };
}

export async function previewLifecycleRequest(
  config: AgoraRuntimeConfig,
  accessToken: string,
  orderCode: string,
  requestType: OrderLifecycleRequestType,
  input: LifecycleRequestInput = {},
) {
  return previewOrderLifecycleRequest(config, accessToken, orderCode, lifecyclePayload(orderCode, requestType, input));
}

export async function submitLifecycleRequest(
  config: AgoraRuntimeConfig,
  accessToken: string,
  orderCode: string,
  requestType: OrderLifecycleRequestType,
  input: LifecycleRequestInput = {},
) {
  const payload = lifecyclePayload(orderCode, requestType, input);
  const preview = await previewOrderLifecycleRequest(config, accessToken, orderCode, payload);
  const created = await createOrderLifecycleRequest(config, accessToken, orderCode, payload, `${payload.code}:idem`);
  return { preview, created };
}

export function lifecycleTimeline(record: OrderLifecycleResponse) {
  const steps = ['Submitted'];
  if (record.eligible === false) steps.push('Rejected by eligibility');
  if (record.status === 'APPROVED') steps.push('Approved');
  if (record.rmaCode) steps.push(`RMA ${record.rmaCode}`);
  if (record.inspectionRequired) steps.push('Inspection required');
  if (record.refundPreview?.status) steps.push(`Refund ${record.refundPreview.status}`);
  if (record.replacementSelectionRequired) steps.push('Replacement selection');
  if (record.appealEvidenceRequired) steps.push('Appeal review');
  if (['REJECTED', 'DISPOSITION_RECORDED', 'COMPLETED'].includes(record.status)) steps.push(record.status);
  return steps;
}

export function lifecycleTrackingSummary(record: OrderLifecycleResponse) {
  const evidence = record.evidence ?? {};
  const trackingStatus = typeof evidence.returnTrackingStatus === 'string' ? evidence.returnTrackingStatus : undefined;
  const disposition = typeof evidence.disposition === 'string' ? evidence.disposition : undefined;
  const refundDelayed = record.refundPreview?.reconciliationRequired || record.refundPreview?.status === 'REQUIRES_BACKOFFICE_CALCULATION';
  return [
    trackingStatus ? `Tracking ${trackingStatus}` : undefined,
    disposition ? `Disposition ${disposition}` : undefined,
    refundDelayed ? 'Delayed refund or reconciliation may require operator review.' : undefined,
  ].filter(Boolean).join(' · ');
}

export function lifecycleAutomationPlan(record: OrderLifecycleResponse) {
  if (record.automationPlan?.length) {
    return record.automationPlan.map((step) => [
      step.owner,
      step.step,
      step.customerVisibleState,
      step.trigger ? `trigger ${step.trigger}` : undefined,
    ].filter(Boolean).join(' · '));
  }
  const evidence = record.evidence ?? {};
  const disposition = typeof evidence.disposition === 'string' ? evidence.disposition : undefined;
  const refundDelayed = record.refundPreview?.reconciliationRequired || record.refundPreview?.status === 'REQUIRES_BACKOFFICE_CALCULATION';
  return [
    record.replacementSelectionRequired
      ? 'Inventory reserves replacement stock; Fulfillment creates exchange shipment.'
      : undefined,
    record.inspectionRequired || disposition
      ? 'Fulfillment records inspection; Inventory records disposition and restock or quarantine decision.'
      : undefined,
    refundDelayed
      ? 'Payment reconciles delayed refund; Order publishes safe customer status.'
      : undefined,
    record.appealEvidenceRequired || record.requestType === 'APPEAL'
      ? 'Process starts appeal SLA review; Order records final appeal outcome.'
      : undefined,
  ].filter(Boolean);
}

export function loadLifecycleRequests(config: AgoraRuntimeConfig, accessToken: string, orderCode: string) {
  return listOrderLifecycleRequests(config, accessToken, orderCode);
}

export function lifecycleSummary(preview?: OrderLifecycleResponse, created?: OrderLifecycleResponse) {
  const status = created?.status ?? preview?.status ?? 'PENDING';
  const rma = created?.rmaCode ?? preview?.rmaCode;
  const refundStatus = created?.refundPreview?.status ?? preview?.refundPreview?.status;
  const replacement = created?.replacementSelectionRequired ?? preview?.replacementSelectionRequired ? 'replacement selection required' : undefined;
  const appeal = created?.appealEvidenceRequired ?? preview?.appealEvidenceRequired ? 'appeal evidence required' : undefined;
  return [status, rma ? `RMA ${rma}` : undefined, refundStatus ? `refund ${refundStatus}` : undefined, replacement, appeal]
    .filter(Boolean)
    .join(' · ');
}
