import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { RemovalRequestRecord } from '../../../domain/entities/RemovalRequestRecord';

interface RequestsTableProps {
  records: RemovalRequestRecord[];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function RequestsTable({ records }: RequestsTableProps) {
  if (records.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No records found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Contact Info</TableCell>
            <TableCell>First Available Slot</TableCell>
            <TableCell>Second Available Slot</TableCell>
            <TableCell>Request Date/Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.callId}>
              <TableCell>{record.userName}</TableCell>
              <TableCell>{record.contactInfo}</TableCell>
              <TableCell>{record.slot1}</TableCell>
              <TableCell>{record.slot2}</TableCell>
              <TableCell>{formatDate(record.submittedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
