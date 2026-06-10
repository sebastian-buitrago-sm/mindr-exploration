import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import intoxalockTheme from '../../../src/presentation/theme/intoxalockTheme';
import HomePage from '../../../src/presentation/pages/HomePage';
import * as submitUseCase from '../../../src/application/useCases/submitRemovalRequest';

vi.mock('mui-tel-input', () => ({
  MuiTelInput: ({ value, onChange, label }: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
  }) => (
    <div>
      <label htmlFor="phone-mock">{label}</label>
      <input
        id="phone-mock"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="phone-input"
      />
    </div>
  ),
}));

vi.mock('../../../src/application/useCases/submitRemovalRequest');

function renderPage() {
  return render(
    <ThemeProvider theme={intoxalockTheme}>
      <HomePage />
    </ThemeProvider>
  );
}

async function fillAndSubmitForm() {
  await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Smith');
  const phoneInput = screen.getByTestId('phone-input');
  await userEvent.clear(phoneInput);
  await userEvent.type(phoneInput, '+15551234567');
  await userEvent.click(screen.getByRole('checkbox'));
  await userEvent.click(screen.getByRole('button', { name: /request device removal call/i }));
}

describe('HomePage error and retry state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error alert when submitRemovalRequest throws', async () => {
    vi.spyOn(submitUseCase, 'submitRemovalRequest').mockRejectedValue(
      new Error('Network failure')
    );

    renderPage();
    await fillAndSubmitForm();

    await waitFor(() => {
      expect(screen.getByText(/network failure/i)).toBeInTheDocument();
    });
  });

  it('shows retry button in error state', async () => {
    vi.spyOn(submitUseCase, 'submitRemovalRequest').mockRejectedValue(new Error('Error'));

    renderPage();
    await fillAndSubmitForm();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('retries with the same payload when retry button is clicked — no re-entry required', async () => {
    const mockSubmit = vi
      .spyOn(submitUseCase, 'submitRemovalRequest')
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce({ conversationId: 'conv_retry', callSid: 'CA_retry', message: 'OK' });

    renderPage();
    await fillAndSubmitForm();

    await waitFor(() => screen.getByRole('button', { name: /try again/i }));
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(2);
      expect(mockSubmit.mock.calls[0][0].fullName).toBe(mockSubmit.mock.calls[1][0].fullName);
    });
  });

  it('shows confirmation screen on successful submission', async () => {
    vi.spyOn(submitUseCase, 'submitRemovalRequest').mockResolvedValue({
      conversationId: 'conv_success',
      callSid: 'CA_success',
      message: 'Call initiated',
    });

    renderPage();
    await fillAndSubmitForm();

    await waitFor(() => {
      expect(screen.getByText(/conv_success/i)).toBeInTheDocument();
      expect(screen.getByText(/an ai agent will contact you shortly/i)).toBeInTheDocument();
    });
  });
});
