import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import intoxalockTheme from '../../../src/presentation/theme/intoxalockTheme';
import { ConfirmationScreen } from '../../../src/presentation/components/ConfirmationScreen/ConfirmationScreen';

function renderScreen(props = {}) {
  return render(
    <ThemeProvider theme={intoxalockTheme}>
      <ConfirmationScreen conversationId="conv_test123" onReset={vi.fn()} {...props} />
    </ThemeProvider>
  );
}

describe('ConfirmationScreen', () => {
  it('renders the conversationId', () => {
    renderScreen();
    expect(screen.getByText(/conv_test123/i)).toBeInTheDocument();
  });

  it('renders the static confirmation message', () => {
    renderScreen();
    expect(screen.getByText(/an ai agent will contact you shortly/i)).toBeInTheDocument();
  });

  it('renders the "Submit Another Request" button', () => {
    renderScreen();
    expect(screen.getByRole('button', { name: /submit another request/i })).toBeInTheDocument();
  });

  it('calls onReset when "Submit Another Request" is clicked', async () => {
    const mockOnReset = vi.fn();
    renderScreen({ onReset: mockOnReset });

    await userEvent.click(screen.getByRole('button', { name: /submit another request/i }));
    expect(mockOnReset).toHaveBeenCalledTimes(1);
  });
});
