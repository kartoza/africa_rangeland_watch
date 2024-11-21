import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Define types for the state
interface Member {
  user: string;
  role: string;
}

interface Invitation {
  user: string;
  role: string;
  status: string;
}

interface Organization {
  members: Member[];
  invitations: Invitation[];
}

interface OrganizationsState {
  organizations: { [key: string]: Organization };
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: OrganizationsState = {
  organizations: {},
  loading: false,
  error: null,
};

// Async thunk for fetching organizations
export const fetchOrganizations = createAsyncThunk("organizations/fetchOrganizations", async () => {
  const response = await fetch("/api/organizations");
  if (!response.ok) throw new Error("Failed to fetch organizations.");
  return (await response.json()) as { [key: string]: Organization };
});

// Slice
const organizationsSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    addMember: (state, action: PayloadAction<{ orgKey: string; member: Member }>) => {
      const { orgKey, member } = action.payload;
      state.organizations[orgKey]?.members.push(member);
    },
    deleteMember: (state, action: PayloadAction<{ orgKey: string; user: string }>) => {
      const { orgKey, user } = action.payload;
      state.organizations[orgKey].members = state.organizations[orgKey]?.members.filter(
        (member) => member.user !== user
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.organizations = action.payload;
        state.loading = false;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch data.";
        state.loading = false;
      });
  },
});

// Export actions and reducer
export const { addMember, deleteMember } = organizationsSlice.actions;
export default organizationsSlice.reducer;
