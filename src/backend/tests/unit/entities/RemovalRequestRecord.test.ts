import { RemovalRequestRecord } from '../../../src/domain/entities/RemovalRequestRecord';

describe('RemovalRequestRecord', () => {
  const validRecord: RemovalRequestRecord = {
    callId: 'conv_abc123',
    submittedAt: '2026-06-10T14:30:00.000Z',
    userName: 'Jane Smith',
    contactInfo: '+15551234567',
    slot1: 'Tuesday June 17 at 2pm',
    slot2: 'Wednesday June 18 at 10am',
  };

  it('accepts a valid record with all six string fields', () => {
    expect(validRecord.callId).toBe('conv_abc123');
    expect(validRecord.submittedAt).toBe('2026-06-10T14:30:00.000Z');
    expect(validRecord.userName).toBe('Jane Smith');
    expect(validRecord.contactInfo).toBe('+15551234567');
    expect(validRecord.slot1).toBe('Tuesday June 17 at 2pm');
    expect(validRecord.slot2).toBe('Wednesday June 18 at 10am');
  });

  it('has exactly the six required string fields', () => {
    const keys = Object.keys(validRecord);
    expect(keys).toHaveLength(6);
    expect(keys).toEqual(
      expect.arrayContaining(['callId', 'submittedAt', 'userName', 'contactInfo', 'slot1', 'slot2'])
    );
  });

  it('all field values are strings', () => {
    for (const value of Object.values(validRecord)) {
      expect(typeof value).toBe('string');
    }
  });
});
