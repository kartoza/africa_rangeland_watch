// store/ticketSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface Ticket {
  id: number;
  title: string;
  description: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
  alert_setting: string | null;
  indicator: string | null;
  file_attachment?: string | null;
}


interface IssueType {
    id: number;
    name: string;
}
  
interface TicketState {
    tickets: Ticket[];
    currentTicket: Ticket | null;
    issueTypes: IssueType[];
    loading: boolean;
    error: string | null;
  }
  
  const initialState: TicketState = {
    tickets: [],
    currentTicket: null,
    issueTypes: [],
    loading: false,
    error: null,
  };


export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async () => {
    const response = await axios.get('/tickets-api/tickets/');
    return response.data;
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId: number) => {
    const response = await axios.get(`/tickets-api/tickets/${ticketId}/`);
    return response.data;
  }
);

export const createTicket = createAsyncThunk<
  Ticket,
  { title: string; description: string; email: string; issue_type: number; file_attachment?: File },
  { rejectValue: string }
>(
  'tickets/createTicket',
  async (ticketData, { rejectWithValue }) => {
    const formData = new FormData();
    formData.append('title', ticketData.title);
    formData.append('description', ticketData.description);
    formData.append('email', ticketData.email);
    formData.append('issue_type', ticketData.issue_type.toString());

    if (ticketData.file_attachment) {
      formData.append('file_attachment', ticketData.file_attachment);
    }

    try {
      const response = await axios.post('/tickets-api/tickets/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'An error occurred');
    }
  }
);

  
  

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateTicketStatus',
  async ({ ticketId, status }: { ticketId: number; status: string }) => {
    const response = await axios.patch(`/tickets-api/tickets/${ticketId}/update_status/`, { status });
    return response.data;
  }
);

export const fetchIssueTypes = createAsyncThunk(
    'tickets/fetchIssueTypes',
    async () => {
      const response = await axios.get('/tickets-api/issue_types/');
      return response.data;
    }
  );

export const ticketSlice = createSlice({
  name: 'ticket',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIssueTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchIssueTypes.fulfilled, (state, action: PayloadAction<IssueType[]>) => {
        state.loading = false;
        state.issueTypes = action.payload;
      })
      .addCase(fetchIssueTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred while fetching issue types';
      })
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTickets.fulfilled, (state, action: PayloadAction<Ticket[]>) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred while fetching tickets';
      })
      .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.currentTicket = action.payload;
      })
      .addCase(createTicket.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.tickets.push(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        // Handle the error from createTicket rejection
        state.loading = false;
        state.error = action.payload || 'An error occurred while creating the ticket';
      })
      .addCase(updateTicketStatus.fulfilled, (state, action: PayloadAction<Ticket>) => {
        const index = state.tickets.findIndex((ticket) => ticket.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
      });
  }  
});

export const { clearError } = ticketSlice.actions;

export default ticketSlice.reducer;
