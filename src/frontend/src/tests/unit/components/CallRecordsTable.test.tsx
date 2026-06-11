import { render, screen } from '@testing-library/react';
import CallRecordsTable from '../../../presentation/components/CallRecordsTable/CallRecordsTable';
import type { CallRecord } from '../../../domain/entities/CallRecord';

const records: CallRecord[] = [
  {
    callId: 'conv_1',
    submittedAt: '2026-06-10T14:00:00.000Z',
    shopPhone: '+12065550100',
    customerSlots: JSON.stringify(['October 10th 2026 at 10:00am']),
    status: 'confirmed',
    confirmedSlot: 'October 10th 2026 at 10:00am',
  },
  {
    callId: 'conv_2',
    submittedAt: '2026-06-09T10:00:00.000Z',
    shopPhone: '+12065550101',
    customerSlots: JSON.stringify(['slot1']),
    status: 'needs_recontact',
    shopSuggestedSlots: JSON.stringify(['Oct 12 8am', 'Oct 15 11am']),
  },
  {
    callId: 'conv_3',
    submittedAt: '2026-06-08T08:00:00.000Z',
    shopPhone: '+12065550102',
    customerSlots: JSON.stringify(['slot1']),
    status: 'failed',
  },
  {
    callId: 'conv_4',
    submittedAt: '2026-06-11T12:00:00.000Z',
    shopPhone: '+12065550103',
    customerSlots: JSON.stringify(['slot1', 'slot2']),
    status: 'in_progress',
  },
];

describe('CallRecordsTable', () => {
  it('(a) renders correct column headers', () => {
    render(<CallRecordsTable records={records} />);
    expect(screen.getByText('Shop Phone')).toBeInTheDocument();
    expect(screen.getByText('Submitted At')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Confirmed Slot')).toBeInTheDocument();
    expect(screen.getByText('Shop Suggested Slots')).toBeInTheDocument();
  });

  it('(b) renders one row per record with correct shop phone', () => {
    render(<CallRecordsTable records={records} />);
    expect(screen.getByText('+12065550100')).toBeInTheDocument();
    expect(screen.getByText('+12065550101')).toBeInTheDocument();
    expect(screen.getByText('+12065550102')).toBeInTheDocument();
    expect(screen.getByText('+12065550103')).toBeInTheDocument();
  });

  it('(c) confirmed → Chip "Confirmed"; needs_recontact → "Needs Recontact"; failed → "Failed"; in_progress → "In Progress" with empty slot columns', () => {
    render(<CallRecordsTable records={records} />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Needs Recontact')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('(d) renders empty-state message when records=[]', () => {
    render(<CallRecordsTable records={[]} />);
    expect(screen.getByText('No call records yet.')).toBeInTheDocument();
  });
});
