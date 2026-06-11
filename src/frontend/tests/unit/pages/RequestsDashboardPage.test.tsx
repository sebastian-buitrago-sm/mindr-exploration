import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequestsDashboardPage from '../../../src/presentation/pages/RequestsDashboardPage';
import type { CallRecord } from '../../../src/domain/entities/CallRecord';

vi.mock('../../../src/application/useCases/getCallRecords');
import { getCallRecords } from '../../../src/application/useCases/getCallRecords';

const mockGetCallRecords = vi.mocked(getCallRecords);

const records: CallRecord[] = [
  {
    callId: 'conv_001',
    submittedAt: '2026-06-10T12:00:00.000Z',
    shopPhone: '+12065550100',
    customerSlots: JSON.stringify(['October 10th 2026 at 10:00am']),
    status: 'confirmed',
    confirmedSlot: 'October 10th 2026 at 10:00am',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <RequestsDashboardPage />
    </MemoryRouter>
  );
}

describe('RequestsDashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state while fetching', () => {
    mockGetCallRecords.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders table when records load successfully', async () => {
    mockGetCallRecords.mockResolvedValueOnce(records);
    renderPage();
    await waitFor(() => expect(screen.getByText('+12065550100')).toBeInTheDocument());
  });

  it('shows error message on API failure', async () => {
    mockGetCallRecords.mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
