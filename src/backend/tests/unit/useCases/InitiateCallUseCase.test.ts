import { InitiateCallUseCase } from '../../../src/application/useCases/InitiateCallUseCase';
import type { ICallRecordRepository } from '../../../src/domain/ports/ICallRecordRepository';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockRepository: jest.Mocked<ICallRecordRepository> = {
  save: jest.fn(),
  updateStatus: jest.fn(),
  findLatestInProgressByShopPhone: jest.fn(),
  findAll: jest.fn(),
};

const ENV = {
  ELEVENLABS_API_KEY: 'test-key',
  ELEVENLABS_AGENT_ID: 'agent-id',
  ELEVENLABS_AGENT_PHONE_NUMBER_ID: 'phone-number-id',
};

function makeSuccessResponse(conversationId: string) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue({ conversation_id: conversationId, callSid: 'CA_test' }),
  };
}

describe('InitiateCallUseCase', () => {
  let useCase: InitiateCallUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...process.env, ...ENV };
    useCase = new InitiateCallUseCase(mockRepository);
    mockRepository.save.mockResolvedValue(undefined);
  });

  it('(a) calls ElevenLabs with to_number and nested dynamic_variables for 2 slots', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse('conv_2slots'));

    await useCase.execute({
      shopPhone: '+12065550100',
      customerSlots: ['October 10th 2026 at 10:00am', 'October 11th 2026 at 2:00pm'],
      submittedAt: '2026-06-10T14:00:00.000Z',
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.to_number).toBe('+12065550100');
    expect(body.conversation_initiation_client_data.dynamic_variables.slot_1).toBe('October 10th 2026 at 10:00am');
    expect(body.conversation_initiation_client_data.dynamic_variables.slot_2).toBe('October 11th 2026 at 2:00pm');
    expect(body.conversation_initiation_client_data.dynamic_variables.slot_3).toBeUndefined();
    expect(body.conversation_initiation_client_data.dynamic_variables.slot_4).toBeUndefined();
  });

  it('(b) includes all four slots when all provided; omits missing ones', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse('conv_4slots'));

    await useCase.execute({
      shopPhone: '+12065550100',
      customerSlots: ['slot1', 'slot2', 'slot3', 'slot4'],
      submittedAt: '2026-06-10T14:00:00.000Z',
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const dv = body.conversation_initiation_client_data.dynamic_variables;
    expect(dv.slot_1).toBe('slot1');
    expect(dv.slot_2).toBe('slot2');
    expect(dv.slot_3).toBe('slot3');
    expect(dv.slot_4).toBe('slot4');
  });

  it('(c) throws validation error for empty customerSlots and makes no API call', async () => {
    await expect(
      useCase.execute({ shopPhone: '+12065550100', customerSlots: [], submittedAt: '2026-06-10T14:00:00.000Z' })
    ).rejects.toThrow();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('(d) returns conversationId from ElevenLabs response', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse('conv_returned'));

    const result = await useCase.execute({
      shopPhone: '+12065550100',
      customerSlots: ['October 10th 2026 at 10:00am'],
      submittedAt: '2026-06-10T14:00:00.000Z',
    });

    expect(result.conversationId).toBe('conv_returned');
  });

  it('(e) ElevenLabs API fails → no DynamoDB record written, error propagated', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, json: jest.fn().mockResolvedValue({}) });

    await expect(
      useCase.execute({ shopPhone: '+12065550100', customerSlots: ['slot1'], submittedAt: '2026-06-10T14:00:00.000Z' })
    ).rejects.toThrow();

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
