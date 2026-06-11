import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PendingCallForm } from '../../../presentation/components/PendingCallForm/PendingCallForm';

vi.mock('../../../application/useCases/initiateCall');
import { initiateCall } from '../../../application/useCases/initiateCall';

const mockInitiateCall = vi.mocked(initiateCall);

function renderForm() {
  return render(
    <MemoryRouter>
      <PendingCallForm />
    </MemoryRouter>
  );
}

describe('PendingCallForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('(a) renders shop phone field and at least two slot pickers', () => {
    renderForm();
    expect(screen.getByLabelText(/shop phone/i)).toBeInTheDocument();
    // DateTimePicker renders as contenteditable with label — check labels present
    expect(screen.getAllByLabelText(/slot 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/slot 2/i).length).toBeGreaterThan(0);
  });

  it('(b) "Add Slot" button visible when fewer than 4 slots; hidden when 4 present', () => {
    renderForm();
    const addBtn = screen.getByRole('button', { name: /add slot/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn); // 3 slots
    expect(screen.getAllByLabelText(/slot 3/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /add slot/i })); // 4 slots
    expect(screen.getAllByLabelText(/slot 4/i).length).toBeGreaterThan(0);

    expect(screen.queryByRole('button', { name: /add slot/i })).not.toBeInTheDocument();
  });

  it('(d) valid submit calls initiateCall and shows success chip', async () => {
    mockInitiateCall.mockResolvedValueOnce({
      conversationId: 'conv_success',
      callSid: 'CA_test',
      message: 'ok',
    });

    renderForm();
    fireEvent.change(screen.getByLabelText(/shop phone/i), { target: { value: '+12065550100' } });
    fireEvent.click(screen.getByRole('button', { name: /initiate call/i }));

    await waitFor(() => expect(screen.getByText(/conv_success/)).toBeInTheDocument());
    expect(mockInitiateCall).toHaveBeenCalledTimes(1);
  });
});
