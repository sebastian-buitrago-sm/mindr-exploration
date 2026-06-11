import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { initiateCall } from '../../../application/useCases/initiateCall';

const PRIMARY = '#003366';
const SECONDARY = '#0066CC';

function formatSlot(dt: Dayjs): string {
  return dt.format('MMMM Do YYYY [at] h:mm a');
}

function defaultSlot1(): Dayjs {
  return dayjs().add(1, 'day').hour(10).minute(0).second(0).millisecond(0);
}

function defaultSlot2(): Dayjs {
  return dayjs().add(2, 'day').hour(14).minute(0).second(0).millisecond(0);
}

export function PendingCallForm() {
  const [shopPhone, setShopPhone] = useState('');
  const [shopPhoneError, setShopPhoneError] = useState('');
  const [slots, setSlots] = useState<Dayjs[]>([defaultSlot1(), defaultSlot2()]);
  const [slotErrors, setSlotErrors] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState('');

  const canAddSlot = slots.length < 4;

  function addSlot() {
    if (!canAddSlot) return;
    setSlots((prev) => [...prev, dayjs().add(prev.length + 1, 'day').hour(10).minute(0).second(0)]);
    setSlotErrors((prev) => [...prev, '']);
  }

  function removeSlot(index: number) {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setSlotErrors((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, value: Dayjs | null) {
    if (!value) return;
    setSlots((prev) => prev.map((s, i) => (i === index ? value : s)));
    setSlotErrors((prev) => prev.map((e, i) => (i === index ? '' : e)));
  }

  function validate(): boolean {
    let valid = true;

    if (!shopPhone.trim()) {
      setShopPhoneError('Shop phone number is required');
      valid = false;
    } else {
      setShopPhoneError('');
    }

    const now = dayjs();
    const errors = slots.map((slot) => {
      if (!slot.isAfter(now)) {
        valid = false;
        return 'Slot must be a future date and time';
      }
      return '';
    });
    setSlotErrors(errors);

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setConversationId('');

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await initiateCall({
        shopPhone: shopPhone.trim(),
        customerSlots: slots.map(formatSlot),
      });
      setConversationId(result.conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate call.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="subtitle2" sx={{ color: PRIMARY, fontWeight: 700, mb: 2 }}>
          Simulate Pending Call
        </Typography>

        <TextField
          label="Shop Phone Number"
          value={shopPhone}
          onChange={(e) => setShopPhone(e.target.value)}
          error={!!shopPhoneError}
          helperText={shopPhoneError || 'E.g. +12065550100 — the service center to call'}
          fullWidth
          required
          size="small"
          sx={{ mb: 3 }}
        />

        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          Customer Available Slots
        </Typography>

        <Stack spacing={2} sx={{ mb: 2 }}>
          {slots.map((slot, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <DateTimePicker
                  label={`Slot ${i + 1}`}
                  value={slot}
                  onChange={(val) => updateSlot(i, val)}
                  disablePast
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: !!slotErrors[i],
                    },
                  }}
                />
                {slotErrors[i] && (
                  <FormHelperText error>{slotErrors[i]}</FormHelperText>
                )}
              </Box>
              {slots.length > 1 && (
                <IconButton
                  aria-label={`Remove slot ${i + 1}`}
                  onClick={() => removeSlot(i)}
                  size="small"
                  sx={{ mt: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Stack>

        {canAddSlot && (
          <Button
            startIcon={<AddIcon />}
            onClick={addSlot}
            size="small"
            sx={{ mb: 3, color: SECONDARY }}
          >
            Add Slot
          </Button>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {conversationId && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Call initiated — ID: ${conversationId}`}
              color="success"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
          sx={{ bgcolor: PRIMARY, '&:hover': { bgcolor: SECONDARY } }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Initiating Call…' : 'Initiate Call'}
        </Button>
      </Box>
    </LocalizationProvider>
  );
}
