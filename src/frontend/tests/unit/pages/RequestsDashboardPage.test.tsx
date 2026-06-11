import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import intoxalockTheme from '../../../src/presentation/theme/intoxalockTheme';
import RequestsDashboardPage from '../../../src/presentation/pages/RequestsDashboardPage';
import * as getRemovalRequestsUseCase from '../../../src/application/useCases/getRemovalRequests';
import { RemovalRequestRecord } from '../../../src/domain/entities/RemovalRequestRecord';

vi.mock('../../../src/application/useCases/getRemovalRequests');

const records: RemovalRequestRecord[] = [
  {
    callId: 'conv_001',
    submittedAt: '2026-06-10T12:00:00.000Z',
    userName: 'Alice Smith',
    contactInfo: '+15551111111',
    slot1: 'Monday at 9am',
    slot2: 'Tuesday at 10am',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={intoxalockTheme}>
        <RequestsDashboardPage />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('RequestsDashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state while fetching', () => {
    vi.spyOn(getRemovalRequestsUseCase, 'getRemovalRequests').mockReturnValue(
      new Promise(() => {})
    );
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders table when records load successfully', async () => {
    vi.spyOn(getRemovalRequestsUseCase, 'getRemovalRequests').mockResolvedValueOnce(records);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    vi.spyOn(getRemovalRequestsUseCase, 'getRemovalRequests').mockRejectedValueOnce(
      new Error('Network error')
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
