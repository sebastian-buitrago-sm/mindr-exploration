import type { CallRecord } from '../../../src/domain/entities/CallRecord';

describe('CallRecord entity', () => {
  const validStatuses: CallRecord['status'][] = ['confirmed', 'needs_recontact', 'failed', 'in_progress'];

  it('accepts all valid status values', () => {
    validStatuses.forEach((status) => {
      const record: CallRecord = {
        callId: 'conv_test',
        submittedAt: '2026-06-10T14:00:00.000Z',
        shopPhone: '+12065550100',
        customerSlots: JSON.stringify(['October 10th 2026 at 10:00am']),
        status,
      };
      expect(record.callId).toBe('conv_test');
      expect(record.status).toBe(status);
    });
  });

  it('requires callId, submittedAt, shopPhone, customerSlots, and status', () => {
    const record: CallRecord = {
      callId: 'conv_abc',
      submittedAt: '2026-06-10T14:00:00.000Z',
      shopPhone: '+15551234567',
      customerSlots: JSON.stringify(['Oct 10 at 10am', 'Oct 11 at 2pm']),
      status: 'in_progress',
    };
    expect(record.callId).toBeTruthy();
    expect(record.submittedAt).toBeTruthy();
    expect(record.shopPhone).toBeTruthy();
    expect(record.customerSlots).toBeTruthy();
    expect(record.status).toBeTruthy();
  });

  it('allows optional confirmedSlot and shopSuggestedSlots', () => {
    const confirmed: CallRecord = {
      callId: 'conv_1',
      submittedAt: '2026-06-10T14:00:00.000Z',
      shopPhone: '+15551234567',
      customerSlots: JSON.stringify(['slot1']),
      status: 'confirmed',
      confirmedSlot: 'October 10th 2026 at 10:00am',
    };
    expect(confirmed.confirmedSlot).toBe('October 10th 2026 at 10:00am');
    expect(confirmed.shopSuggestedSlots).toBeUndefined();

    const recontact: CallRecord = {
      callId: 'conv_2',
      submittedAt: '2026-06-10T14:00:00.000Z',
      shopPhone: '+15551234567',
      customerSlots: JSON.stringify(['slot1']),
      status: 'needs_recontact',
      shopSuggestedSlots: JSON.stringify(['Oct 12 8am-11am', 'Oct 15 11am-2pm']),
    };
    expect(recontact.shopSuggestedSlots).toBeTruthy();
    expect(recontact.confirmedSlot).toBeUndefined();
  });
});
