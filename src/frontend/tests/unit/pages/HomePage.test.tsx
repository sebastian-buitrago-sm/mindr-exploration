import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../../src/presentation/pages/HomePage';

vi.mock('../../../src/application/useCases/initiateCall', () => ({
  initiateCall: vi.fn().mockResolvedValue({ conversationId: 'conv_test', callSid: 'CA_test', message: 'ok' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('renders the PendingCallForm embed', () => {
    renderPage();
    expect(screen.getByLabelText(/shop phone/i)).toBeInTheDocument();
  });

  it('renders nav link to Call Records', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /call records/i })).toBeInTheDocument();
  });

  it('renders the Intoxalock brand header', () => {
    renderPage();
    expect(screen.getAllByText(/intoxalock/i).length).toBeGreaterThan(0);
  });
});
