import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import intoxalockTheme from '../../../src/presentation/theme/intoxalockTheme';
import RequestsTable from '../../../src/presentation/components/RequestsTable/RequestsTable';
import { RemovalRequestRecord } from '../../../src/domain/entities/RemovalRequestRecord';

const records: RemovalRequestRecord[] = [
  {
    callId: 'conv_001',
    submittedAt: '2026-06-10T12:00:00.000Z',
    userName: 'Alice Smith',
    contactInfo: '+15551111111',
    slot1: 'Monday at 9am',
    slot2: 'Tuesday at 10am',
  },
  {
    callId: 'conv_002',
    submittedAt: '2026-06-10T10:00:00.000Z',
    userName: 'Bob Jones',
    contactInfo: '+15552222222',
    slot1: 'Wednesday at 1pm',
    slot2: 'Thursday at 2pm',
  },
];

function renderTable(props: { records: RemovalRequestRecord[] }) {
  return render(
    <ThemeProvider theme={intoxalockTheme}>
      <RequestsTable {...props} />
    </ThemeProvider>
  );
}

describe('RequestsTable', () => {
  it('renders all rows', () => {
    renderTable({ records });
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders correct column headers', () => {
    renderTable({ records });
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/contact/i)).toBeInTheDocument();
    expect(screen.getByText(/first.*slot|slot.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/second.*slot|slot.*2/i)).toBeInTheDocument();
    expect(screen.getByText(/date|time/i)).toBeInTheDocument();
  });

  it('renders empty-state message when records is empty', () => {
    renderTable({ records: [] });
    expect(screen.getByText(/no records/i)).toBeInTheDocument();
  });
});
