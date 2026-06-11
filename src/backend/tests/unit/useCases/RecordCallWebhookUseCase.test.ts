import { RecordCallWebhookUseCase } from '../../../src/application/useCases/RecordCallWebhookUseCase';
import type { ICallRecordRepository } from '../../../src/domain/ports/ICallRecordRepository';

const mockRepository: jest.Mocked<ICallRecordRepository> = {
  save: jest.fn(),
  updateStatus: jest.fn(),
  findLatestInProgressByShopPhone: jest.fn(),
  findAll: jest.fn(),
};

function makePayload(overrides: Record<string, string> = {}) {
  return {
    data: {
      conversation_id: 'conv_abc123',
      data_collection_results: {
        confirmed_slot: { value: overrides.confirmed_slot ?? '' },
        shop_suggested_slot_1: { value: overrides.shop_suggested_slot_1 ?? '' },
        shop_suggested_slot_2: { value: overrides.shop_suggested_slot_2 ?? '' },
      },
    },
  };
}

describe('RecordCallWebhookUseCase', () => {
  let useCase: RecordCallWebhookUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.updateStatus.mockResolvedValue(undefined);
    mockRepository.save.mockResolvedValue(undefined);
    useCase = new RecordCallWebhookUseCase(mockRepository);
  });

  it('(a) confirmed_slot non-empty → status=confirmed, updateStatus called with confirmedSlot', async () => {
    await useCase.execute(makePayload({ confirmed_slot: 'October 10th 2026 at 10:00am' }));

    expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockRepository.updateStatus).toHaveBeenCalledWith(
      'conv_abc123',
      'confirmed',
      'October 10th 2026 at 10:00am',
      undefined
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('(b) empty confirmed_slot + non-empty shop_suggested_slot_1 → status=needs_recontact, shopSuggestedSlots set', async () => {
    await useCase.execute(makePayload({
      shop_suggested_slot_1: 'October 12th 2026 at 8:00am',
      shop_suggested_slot_2: 'October 15th 2026 at 11:00am',
    }));

    expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
    const [, status, , shopSuggestedSlots] = mockRepository.updateStatus.mock.calls[0];
    expect(status).toBe('needs_recontact');
    const shopSlots = JSON.parse(shopSuggestedSlots!);
    expect(shopSlots).toContain('October 12th 2026 at 8:00am');
    expect(shopSlots).toContain('October 15th 2026 at 11:00am');
  });

  it('(c) all empty values → status=failed, no slot fields', async () => {
    await useCase.execute(makePayload());

    expect(mockRepository.updateStatus).toHaveBeenCalledTimes(1);
    const [, status, confirmedSlot, shopSuggestedSlots] = mockRepository.updateStatus.mock.calls[0];
    expect(status).toBe('failed');
    expect(confirmedSlot).toBeUndefined();
    expect(shopSuggestedSlots).toBeUndefined();
  });

  it('(d) duplicate callId → repository.updateStatus called again (upsert, no error)', async () => {
    await useCase.execute(makePayload({ confirmed_slot: 'slot1' }));
    await useCase.execute(makePayload({ confirmed_slot: 'slot1' }));
    expect(mockRepository.updateStatus).toHaveBeenCalledTimes(2);
  });

  it('(e) no conversation_id → repository.save called with new UUID', async () => {
    const payloadNoId = {
      confirmed_slot: 'October 10th 2026 at 10:00am',
    };
    await useCase.execute(payloadNoId as Parameters<typeof useCase.execute>[0]);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const saved = mockRepository.save.mock.calls[0][0];
    expect(saved.callId).toMatch(/^[0-9a-f-]{36}$/);
    expect(saved.status).toBe('confirmed');
    expect(mockRepository.updateStatus).not.toHaveBeenCalled();
  });
});
