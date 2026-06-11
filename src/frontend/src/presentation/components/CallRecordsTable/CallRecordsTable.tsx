import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { CallRecord } from '../../../domain/entities/CallRecord';

interface CallRecordsTableProps {
  records: CallRecord[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function parseSlotsJson(raw?: string): string {
  if (!raw) return '—';
  try {
    const arr = JSON.parse(raw) as string[];
    return arr.join(', ') || '—';
  } catch {
    return raw;
  }
}

function StatusChip({ status }: { status: CallRecord['status'] }) {
  switch (status) {
    case 'confirmed':
      return <Chip label="Confirmed" color="success" size="small" />;
    case 'needs_recontact':
      return <Chip label="Needs Recontact" size="small" sx={{ bgcolor: 'orange', color: 'white' }} />;
    case 'failed':
      return <Chip label="Failed" color="error" size="small" />;
    case 'in_progress':
      return <Chip label="In Progress" size="small" sx={{ bgcolor: 'grey.400' }} />;
    default:
      return <Chip label={status} size="small" />;
  }
}

export default function CallRecordsTable({ records }: CallRecordsTableProps) {
  if (records.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No call records yet.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#003366' }}>
            {['Shop Phone', 'Submitted At', 'Status', 'Confirmed Slot', 'Shop Suggested Slots'].map((h) => (
              <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={`${record.callId}-${record.submittedAt}`} hover>
              <TableCell>{record.shopPhone || '—'}</TableCell>
              <TableCell>{formatDate(record.submittedAt)}</TableCell>
              <TableCell><StatusChip status={record.status} /></TableCell>
              <TableCell>
                {record.status === 'in_progress' ? '—' : (record.confirmedSlot || '—')}
              </TableCell>
              <TableCell>
                {record.status === 'in_progress' ? '—' : parseSlotsJson(record.shopSuggestedSlots)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
