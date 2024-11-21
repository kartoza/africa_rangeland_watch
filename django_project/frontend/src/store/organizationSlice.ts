import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Define types for the state
interface Member {
  user: string;
  role: string;
}

interface Invitation {
  email: string;
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
export const fetchOrganizations = createAsyncThunk(
  "organizations/fetchOrganizations",
  async () => {
    const response = await fetch("/api/organizations");
    if (!response.ok) throw new Error("Failed to fetch organizations.");
    return (await response.json()) as { [key: string]: Organization };
  }
);

// Async thunk for inviting a member to an organization
export const inviteMemberThunk = createAsyncThunk(
  "organizations/inviteMember",
  async ({ orgKey, email }: { orgKey: string; email: string }) => {
    const response = await fetch(`/api/organizations/${orgKey}/invite/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error("Failed to send invitation.");
    return { orgKey, email };
  }
);

// Async thunk for deleting a member from an organization
export const deleteMember = createAsyncThunk(
  "organizations/deleteMember",
  async ({ orgKey, user }: { orgKey: string; user: string }) => {
    const response = await fetch(`/api/organizations/${orgKey}/member/${user}/delete/`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete member.");
    return { orgKey, user };
  }
);

// Slice
const organizationsSlice = createSlice({
  name: "organizations",
  initialState,
  reducers: {
    addMember: (state, action: PayloadAction<{ orgKey: string; member: Member }>) => {
      const { orgKey, member } = action.payload;
      state.organizations[orgKey]?.members.push(member);
    },
    deleteMemberFromState: (state, action: PayloadAction<{ orgKey: string; user: string }>) => {
      const { orgKey, user } = action.payload;
      state.organizations[orgKey].members = state.organizations[orgKey]?.members.filter(
        (member) => member.user !== user 
      );
    },
    inviteMember: (state, action: PayloadAction<{ orgKey: string; email: string; message: string }>) => {
      const { orgKey, email, message } = action.payload;
      const newInvitation: Invitation = { 
        email, 
        status: "pending"
      };
      state.organizations[orgKey].invitations.push(newInvitation);
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
      })
      .addCase(inviteMemberThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(inviteMemberThunk.fulfilled, (state, action) => {
        const { orgKey, email } = action.payload;
        const invitation: Invitation = { email, status: "pending" };
        state.organizations[orgKey]?.invitations.push(invitation);
        state.loading = false;
      })
      .addCase(inviteMemberThunk.rejected, (state, action) => {
        state.error = action.error.message || "Failed to send invitation.";
        state.loading = false;
      })
      .addCase(deleteMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        const { orgKey, user } = action.payload;
        state.organizations[orgKey].members = state.organizations[orgKey]?.members.filter(
          (member) => member.user !== user
        );
        state.loading = false;
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete member.";
        state.loading = false;
      });
  },
});

// Export actions and reducer
export const { addMember, deleteMemberFromState, inviteMember } = organizationsSlice.actions;
export default organizationsSlice.reducer;
