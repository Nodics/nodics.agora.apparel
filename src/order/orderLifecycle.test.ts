import { describe, expect, it, vi } from 'vitest';

import { lifecycleAutomationPlan, lifecycleFormGuidance, lifecyclePayload, lifecycleReason, lifecycleSummary, lifecycleTimeline, lifecycleTrackingSummary, lifecycleTypes, preferredResolutionOptions, previewLifecycleRequest, submitLifecycleRequest } from './orderLifecycle';

describe('order lifecycle contract', () => {
  it('covers cancellation return refund exchange replacement and appeal customer intents', () => {
    expect(lifecycleTypes).toEqual(['CANCELLATION', 'RETURN', 'REFUND', 'EXCHANGE', 'REPLACEMENT', 'APPEAL']);
    expect(lifecycleReason('CANCELLATION')).toBe('CUSTOMER_CHANGED_MIND');
    expect(lifecycleReason('RETURN')).toBe('SIZE_OR_EXPECTATION_MISMATCH');
    expect(lifecycleReason('REFUND')).toBe('REFUND_STATUS_REQUESTED');
    expect(lifecycleReason('EXCHANGE')).toBe('SIZE_OR_EXPECTATION_MISMATCH');
    expect(lifecycleReason('REPLACEMENT')).toBe('DAMAGED_ITEM');
    expect(lifecycleReason('APPEAL')).toBe('CANCELLATION_REJECTED');
    expect(preferredResolutionOptions).toContain('SHIP_REPLACEMENT');
    expect(lifecycleFormGuidance.APPEAL).toContain('Reference a rejected or delayed lifecycle case');
  });

  it('submits item quantity return method refund method replacement and appeal evidence', async () => {
    const calls: { target: string; body: unknown }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      calls.push({ target: String(input), body: JSON.parse(String(options?.body)) });
      return new Response(JSON.stringify({ data: { orderCode: 'order-1', requestType: 'RETURN', status: 'SUBMITTED' } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));

    const result = await submitLifecycleRequest({
      cmsBaseUrl: 'http://localhost:4314',
      mediaBaseUrl: 'http://localhost:4314',
      profileBaseUrl: 'http://localhost:4300',
      commerceBaseUrl: 'http://localhost:4350',
      engagementBaseUrl: 'http://localhost:4340',
      enterpriseCode: 'default',
      tenantCode: 'default',
      siteCode: 'agora',
      channel: 'web',
      storeCode: 'agoraMainStore',
      locale: 'en',
      requestTimeoutMs: 1000,
    }, 'customer-token', 'order-1', 'RETURN', {
      reasonCode: 'DAMAGED_ITEM',
      quantity: '1',
      returnMethod: 'DROP_OFF',
      refundMethod: 'ORIGINAL_PAYMENT',
      productCodes: ['agoraLinenWrapDress'],
      replacementProductCode: 'agoraCashmereCardigan',
      preferredResolution: 'SHIP_REPLACEMENT',
      appealReferenceCode: 'order-1:return:1',
      appealReason: 'Inspection evidence missing',
    });

    expect(calls[0]?.target).toContain('/customer/orders/order-1/lifecycle/preview');
    expect(calls[1]?.target).toContain('/customer/orders/order-1/lifecycle');
    expect(result.created.status).toBe('SUBMITTED');
    expect(calls[1]?.body).toMatchObject({
      requestType: 'RETURN',
      reasonCode: 'DAMAGED_ITEM',
      evidence: {
        quantity: '1',
        returnMethod: 'DROP_OFF',
        refundMethod: 'ORIGINAL_PAYMENT',
        productCodes: ['agoraLinenWrapDress'],
        replacementProductCode: 'agoraCashmereCardigan',
        preferredResolution: 'SHIP_REPLACEMENT',
        appealReferenceCode: 'order-1:return:1',
        appealReason: 'Inspection evidence missing',
      },
    });
    vi.unstubAllGlobals();
  });

  it('previews lifecycle eligibility without creating the request', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ data: { orderCode: 'order-1', requestType: 'EXCHANGE', status: 'PREVIEWED', eligible: true, rmaCode: 'order-1:RMA:1', replacementSelectionRequired: true } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));

    const preview = await previewLifecycleRequest({
      cmsBaseUrl: 'http://localhost:4314',
      mediaBaseUrl: 'http://localhost:4314',
      profileBaseUrl: 'http://localhost:4300',
      commerceBaseUrl: 'http://localhost:4350',
      engagementBaseUrl: 'http://localhost:4340',
      enterpriseCode: 'default',
      tenantCode: 'default',
      siteCode: 'agora',
      channel: 'web',
      storeCode: 'agoraMainStore',
      locale: 'en',
      requestTimeoutMs: 1000,
    }, 'customer-token', 'order-1', 'EXCHANGE', {
      preferredResolution: 'SHIP_REPLACEMENT',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('/customer/orders/order-1/lifecycle/preview');
    expect(preview.rmaCode).toBe('order-1:RMA:1');
    expect(lifecyclePayload('order-1', 'APPEAL', { appealReferenceCode: 'case-1' }).evidence?.appealReferenceCode).toBe('case-1');
    vi.unstubAllGlobals();
  });

  it('summarizes lifecycle preview and creation evidence for customer order status', () => {
    expect(lifecycleSummary({
      orderCode: 'order-1',
      requestType: 'RETURN',
      status: 'PREVIEWED',
      rmaCode: 'order-1:RMA:1',
      refundPreview: { status: 'REQUIRES_BACKOFFICE_CALCULATION' },
    }, {
      orderCode: 'order-1',
      requestType: 'RETURN',
      status: 'SUBMITTED',
    })).toBe('SUBMITTED · RMA order-1:RMA:1 · refund REQUIRES_BACKOFFICE_CALCULATION');
    expect(lifecycleSummary({
      orderCode: 'order-1',
      requestType: 'EXCHANGE',
      status: 'PREVIEWED',
      replacementSelectionRequired: true,
    })).toBe('PREVIEWED · replacement selection required');
    expect(lifecycleSummary({
      orderCode: 'order-1',
      requestType: 'APPEAL',
      status: 'PREVIEWED',
      appealEvidenceRequired: true,
    })).toBe('PREVIEWED · appeal evidence required');
    expect(lifecycleTimeline({
      orderCode: 'order-1',
      requestType: 'RETURN',
      status: 'SUBMITTED',
      rmaCode: 'order-1:RMA:1',
      inspectionRequired: true,
      refundPreview: { status: 'REQUIRES_BACKOFFICE_CALCULATION' },
    })).toEqual(['Submitted', 'RMA order-1:RMA:1', 'Inspection required', 'Refund REQUIRES_BACKOFFICE_CALCULATION']);
    expect(lifecycleTrackingSummary({
      orderCode: 'order-1',
      requestType: 'REFUND',
      status: 'SUBMITTED',
      refundPreview: { status: 'REQUIRES_BACKOFFICE_CALCULATION', reconciliationRequired: true },
      evidence: { returnTrackingStatus: 'IN_TRANSIT', disposition: 'PENDING' },
    })).toContain('Delayed refund or reconciliation');
  });

  it('maps advanced lifecycle evidence to backend-owned automation plans', () => {
    expect(lifecycleAutomationPlan({
      orderCode: 'order-1',
      requestType: 'EXCHANGE',
      status: 'SUBMITTED',
      automationPlan: [
        { step: 'replacement-reservation', owner: 'inventory', trigger: 'agoraCashmereCardigan', customerVisibleState: 'Replacement selection received' },
      ],
    })).toContain('inventory · replacement-reservation · Replacement selection received · trigger agoraCashmereCardigan');
    expect(lifecycleAutomationPlan({
      orderCode: 'order-1',
      requestType: 'EXCHANGE',
      status: 'SUBMITTED',
      replacementSelectionRequired: true,
    })).toContain('Inventory reserves replacement stock; Fulfillment creates exchange shipment.');
    expect(lifecycleAutomationPlan({
      orderCode: 'order-1',
      requestType: 'RETURN',
      status: 'SUBMITTED',
      inspectionRequired: true,
      evidence: { disposition: 'QUARANTINE' },
    })).toContain('Fulfillment records inspection; Inventory records disposition and restock or quarantine decision.');
    expect(lifecycleAutomationPlan({
      orderCode: 'order-1',
      requestType: 'REFUND',
      status: 'SUBMITTED',
      refundPreview: { status: 'REQUIRES_BACKOFFICE_CALCULATION', reconciliationRequired: true },
    })).toContain('Payment reconciles delayed refund; Order publishes safe customer status.');
    expect(lifecycleAutomationPlan({
      orderCode: 'order-1',
      requestType: 'APPEAL',
      status: 'SUBMITTED',
      appealEvidenceRequired: true,
    })).toContain('Process starts appeal SLA review; Order records final appeal outcome.');
  });
});
