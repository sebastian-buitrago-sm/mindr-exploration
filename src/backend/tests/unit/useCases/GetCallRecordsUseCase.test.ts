import { GetCallRecordsUseCase } from '../../../src/application/useCases/GetCallRecordsUseCase';
import type { ICallRecordRepository } from '../../../src/domain/ports/ICallRecordRepository';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

const mockRepository: jest.Mocked<ICallRecordRepository> = {
  save: jest.fn(),
  updateStatus: jest.fn(),
  findLatestInProgressByShopPhone: jest.fn(),
  findAll: jest.fn(),
};

const records: CallRecord[] = [
  {
    callId: 'conv_1',
    submittedAt: '2026-06-10T14:00:00.000Z',
    shopPhone: '+12065550100',
    customerSlots: JSON.stringify(['slot1']),
    status: 'confirmed',
    confirmedSlot: 'October 10th 2026 at 10:00am',
  },
  {
    callId: 'conv_2',
    submittedAt: '2026-06-09T10:00:00.000Z',
    shopPhone: '+12065550101',
    customerSlots: JSON.stringify(['slot1', 'slot2']),
    status: 'in_progress',
  },
];

describe('GetCallRecordsUseCase', () => {
  let useCase: GetCallRecordsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetCallRecordsUseCase(mockRepository);
  });

  it('(a) calls repository.findAll() and returns result unchanged', async () => {
    mockRepository.findAll.mockResolvedValueOnce(records);
    const result = await useCase.execute();
    expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(records);
  });

  it('(b) returns empty array when repository returns empty', async () => {
    mockRepository.findAll.mockResolvedValueOnce([]);
    const result = await useCase.execute();
    expect(result).toEqual([]);
  });
});
