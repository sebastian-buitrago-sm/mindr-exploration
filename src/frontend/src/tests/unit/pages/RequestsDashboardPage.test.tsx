import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequestsDashboardPage from '../../../presentation/pages/RequestsDashboardPage';

vi.mock('../../../application/useCases/getCallRecords');
import { getCallRecords } from '../../../application/useCases/getCallRecords';

const mockGetCallRecords = vi.mocked(getCallRecords);

function renderPage() {
  return render(
    <MemoryRouter>
      <RequestsDashboardPage />
    </MemoryRouter>
  );
}

describe('RequestsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('(a) shows CircularProgress while fetching', () => {
    mockGetCallRecords.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('(b) renders CallRecordsTable when records load', async () => {
    mockGetCallRecords.mockResolvedValueOnce([
      {
        callId: 'conv_1',
        submittedAt: '2026-06-10T14:00:00.000Z',
        shopPhone: '+12065550100',
        customerSlots: JSON.stringify(['slot1']),
        status: 'confirmed',
        confirmedSlot: 'October 10th 2026 at 10:00am',
      },
    ]);
    renderPage();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    expect(screen.getByText('+12065550100')).toBeInTheDocument();
  });

  it('(c) shows Alert on API failure', async () => {
    mockGetCallRecords.mockRejectedValueOnce(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });
});
