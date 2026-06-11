import { GetRemovalRequestsUseCase } from '../../../src/application/useCases/GetRemovalRequestsUseCase';
import { IRemovalRequestRepository } from '../../../src/domain/ports/IRemovalRequestRepository';
import { RemovalRequestRecord } from '../../../src/domain/entities/RemovalRequestRecord';

const mockRepository: jest.Mocked<IRemovalRequestRepository> = {
  save: jest.fn(),
  findAll: jest.fn(),
};

describe('GetRemovalRequestsUseCase', () => {
  let useCase: GetRemovalRequestsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetRemovalRequestsUseCase(mockRepository);
  });

  const records: RemovalRequestRecord[] = [
    {
      callId: 'conv_002',
      submittedAt: '2026-06-10T12:00:00.000Z',
      userName: 'Bob',
      contactInfo: '+15550002222',
      slot1: 'Wednesday at 1pm',
      slot2: 'Thursday at 2pm',
    },
    {
      callId: 'conv_001',
      submittedAt: '2026-06-10T10:00:00.000Z',
      userName: 'Alice',
      contactInfo: '+15550001111',
      slot1: 'Monday at 9am',
      slot2: 'Tuesday at 10am',
    },
  ];

  it('calls repository.findAll()', async () => {
    mockRepository.findAll.mockResolvedValueOnce(records);
    await useCase.execute();
    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns records in descending submittedAt order', async () => {
    mockRepository.findAll.mockResolvedValueOnce(records);
    const result = await useCase.execute();
    expect(result).toHaveLength(2);
    expect(result[0].callId).toBe('conv_002');
    expect(result[1].callId).toBe('conv_001');
  });

  it('returns empty array when no records exist', async () => {
    mockRepository.findAll.mockResolvedValueOnce([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
