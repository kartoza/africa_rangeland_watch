import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";

// Define types for the state
interface Member {
  user: string;
  role: string;
}

interface Invitation {
  email: string;
  accepted: boolean;
}

interface Organization {
  members: Member[];
  invitations: Invitation[];
}

interface OrganizationsState {
  organizations: { [key: string]: Organization };
  loading: boolean;
  error: string | null;
  refetch: boolean; 
}

// Initial state
const initialState: OrganizationsState = {
  organizations: {},
  loading: false,
  error: null,
  refetch: false,
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
  async ({ orgKey, email, message }: { orgKey: number; email: string; message: string }) => {
      const response = await fetch(`/api/organization/${orgKey}/invite/`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, message }),
      });
      if (!response.ok) throw new Error("Failed to send invitation.");
      return { orgKey, email };
  }
);


// Async thunk for deleting a member from an organization
export const deleteMember = createAsyncThunk(
  "organizations/deleteMember",
  async ({ orgKey, user }: { orgKey: string; user: string }) => {
    const response = await fetch(`/api/organizations/member/delete/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organisation_id: orgKey,
        user_email: user,
      }),
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
        accepted: false
      };
      state.organizations[orgKey].invitations.push(newInvitation);
    },
    resetRefetch: (state) => {
      state.refetch = false;
    }
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
        state.refetch = false;
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
        const invitation: Invitation = { email, accepted: false };
        state.organizations[orgKey]?.invitations.push(invitation);
        state.loading = false;
        state.refetch = true;
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
        state.loading = false;
        state.refetch = true;
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete member.";
        state.loading = false;
      });
  },
});


export const selectRefetch = (state: RootState) => state.organization.refetch;
export const { addMember, deleteMemberFromState, inviteMember, resetRefetch } = organizationsSlice.actions;
export default organizationsSlice.reducer;