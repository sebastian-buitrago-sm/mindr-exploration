import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import intoxalockTheme from '../../../src/presentation/theme/intoxalockTheme';
import { RequestForm } from '../../../src/presentation/components/RequestForm/RequestForm';

vi.mock('mui-tel-input', () => ({
  MuiTelInput: ({ value, onChange, label, error, helperText }: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
    error?: boolean;
    helperText?: string;
  }) => (
    <div>
      <label htmlFor="phone-mock">{label}</label>
      <input
        id="phone-mock"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="phone-input"
      />
      {error && helperText && <span role="alert">{helperText}</span>}
    </div>
  ),
}));

const mockSubmitFn = vi.fn();
const mockOnSuccess = vi.fn();
const mockOnError = vi.fn();

function renderForm() {
  return render(
    <ThemeProvider theme={intoxalockTheme}>
      <RequestForm onSuccess={mockOnSuccess} onError={mockOnError} submitFn={mockSubmitFn} />
    </ThemeProvider>
  );
}

describe('RequestForm validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when full name is empty on submit', async () => {
    renderForm();
    const submitButton = screen.getByRole('button', { name: /request device removal call/i });
    await userEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
  });

  it('keeps submit button enabled before interaction', () => {
    renderForm();
    const submitButton = screen.getByRole('button', { name: /request device removal call/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('does not call submitFn when form is invalid', async () => {
    renderForm();
    const submitButton = screen.getByRole('button', { name: /request device removal call/i });
    await userEvent.click(submitButton);
    await waitFor(() => {
      expect(mockSubmitFn).not.toHaveBeenCalled();
    });
  });

  it('calls submitFn when form has valid data and consent checked', async () => {
    mockSubmitFn.mockResolvedValue({
      conversationId: 'conv_test',
      callSid: 'CA_test',
      message: 'Call initiated',
    });

    renderForm();

    const nameInput = screen.getByLabelText(/full name/i);
    await userEvent.type(nameInput, 'Jane Smith');

    const phoneInput = screen.getByTestId('phone-input');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '+15551234567');

    const consentCheckbox = screen.getByRole('checkbox');
    await userEvent.click(consentCheckbox);

    const submitButton = screen.getByRole('button', { name: /request device removal call/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitFn).toHaveBeenCalled();
    });
  });
});
