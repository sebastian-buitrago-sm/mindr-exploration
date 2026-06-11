import { RecordCallWebhookUseCase } from '../../../src/application/useCases/RecordCallWebhookUseCase';
import { IRemovalRequestRepository } from '../../../src/domain/ports/IRemovalRequestRepository';

const mockRepository: jest.Mocked<IRemovalRequestRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
};

describe('RecordCallWebhookUseCase', () => {
  let useCase: RecordCallWebhookUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RecordCallWebhookUseCase(mockRepository);
  });

  const validPayload = {
    data: {
      conversation_id: 'conv_abc123',
      data_collection_results: {
        user_name: { value: 'Jane Smith' },
        contact_info: { value: '+15551234567' },
        slot_1: { value: 'Tuesday June 17 at 2pm' },
        slot_2: { value: 'Wednesday June 18 at 10am' },
      },
    },
  };

  it('saves a record when all four fields are present', async () => {
    mockRepository.save.mockResolvedValueOnce(undefined);
    await useCase.execute(validPayload);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const saved = mockRepository.save.mock.calls[0][0];
    expect(saved.callId).toBe('conv_abc123');
    expect(saved.userName).toBe('Jane Smith');
    expect(saved.contactInfo).toBe('+15551234567');
    expect(saved.slot1).toBe('Tuesday June 17 at 2pm');
    expect(saved.slot2).toBe('Wednesday June 18 at 10am');
    expect(typeof saved.submittedAt).toBe('string');
  });

  it.each([
    ['user_name', { user_name: { value: '' }, contact_info: { value: '+15551234567' }, slot_1: { value: 'slot1' }, slot_2: { value: 'slot2' } }],
    ['contact_info', { user_name: { value: 'Jane' }, contact_info: { value: '' }, slot_1: { value: 'slot1' }, slot_2: { value: 'slot2' } }],
    ['slot_1', { user_name: { value: 'Jane' }, contact_info: { value: '+1555' }, slot_1: { value: '' }, slot_2: { value: 'slot2' } }],
    ['slot_2', { user_name: { value: 'Jane' }, contact_info: { value: '+1555' }, slot_1: { value: 'slot1' }, slot_2: { value: '' } }],
  ])('silently discards when %s is empty', async (_field, dataCollectionResults) => {
    const payload = {
      data: {
        conversation_id: 'conv_xyz',
        data_collection_results: dataCollectionResults,
      },
    };
    await useCase.execute(payload);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('silently discards when data_collection_results is missing', async () => {
    await useCase.execute({ data: { conversation_id: 'conv_xyz' } });
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('calls save without error for duplicate callId', async () => {
    mockRepository.save.mockResolvedValue(undefined);
    await useCase.execute(validPayload);
    await useCase.execute(validPayload);
    expect(mockRepository.save).toHaveBeenCalledTimes(2);
  });

  describe('flat tool-call format', () => {
    const flatPayload = {
      conversation_id: 'conv_tool123',
      user_name: 'Jane Smith',
      contact_info: '+15551234567',
      slot_1: 'Tuesday June 17 at 2pm',
      slot_2: 'Wednesday June 18 at 10am',
    };

    it('saves a record from the flat tool-call payload', async () => {
      mockRepository.save.mockResolvedValueOnce(undefined);
      await useCase.execute(flatPayload);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const saved = mockRepository.save.mock.calls[0][0];
      expect(saved.callId).toBe('conv_tool123');
      expect(saved.userName).toBe('Jane Smith');
      expect(saved.slot1).toBe('Tuesday June 17 at 2pm');
    });

    it('silently discards flat payload with missing field', async () => {
      await useCase.execute({ ...flatPayload, user_name: '' });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
