import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import axios from "axios";
import { setCSRFToken } from '../utils/csrfUtils';

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


// Configure Axios globally for JSON requests
axios.defaults.headers.common["Content-Type"] = "application/json";

// Async thunk for fetching organizations
export const fetchOrganizations = createAsyncThunk(
  "organizations/fetchOrganizations",
  async (): Promise<{ [key: string]: Organization }> => {
    setCSRFToken();
    const response = await axios.get("/api/organizations");

    // Dummy organization data to append
    const dummyOrg = {
      Test12: {
        org_id: 1,
        members: [
          { user_profile__user__email: "test@gmail.com", user_type: "member" },
          { user_profile__user__email: "alice@example.com", user_type: "member" },
          { user_profile__user__email: "bob@example.com", user_type: "admin" },
          { user_profile__user__email: "charlie@example.com", user_type: "member" },
          { user_profile__user__email: "dave@example.com", user_type: "member" },
          { user_profile__user__email: "eve@example.com", user_type: "admin" },
          { user_profile__user__email: "frank@example.com", user_type: "member" },
          { user_profile__user__email: "grace@example.com", user_type: "member" },
          { user_profile__user__email: "henry@example.com", user_type: "admin" },
          { user_profile__user__email: "irene@example.com", user_type: "member" },
        ],
        invitations: [
          { email: "test@gmail.com", accepted: true },
          { email: "danang@kartoza.com", accepted: false },
          { email: "test25@gmail.com", accepted: false },
          { email: "john@example.com", accepted: false },
          { email: "jane@example.com", accepted: true },
          { email: "peter@example.com", accepted: false },
          { email: "mary@example.com", accepted: true },
          { email: "lucas@example.com", accepted: false },
          { email: "anna@example.com", accepted: true },
          { email: "mark@example.com", accepted: false },
        ],
        is_manager: false,
      },
    };

    // Transform dummy data to match the Organization interface
    const transformedDummyOrg = Object.fromEntries(
      Object.entries(dummyOrg).map(([key, value]) => [
        key,
        {
          members: value.members.map((m) => ({
            user: m.user_profile__user__email,
            role: m.user_type,
          })),
          invitations: value.invitations,
        },
      ])
    );

    // Merge the API response with the dummy organization data
    const mergedOrganizations = {
      ...response.data,
      ...transformedDummyOrg,
    };

    return mergedOrganizations;
  }
);


// Async thunk for inviting a member to an organization
export const inviteMemberThunk = createAsyncThunk(
  "organizations/inviteMember",
  async ({ orgKey, email, message }: { orgKey: number; email: string; message: string }) => {
    setCSRFToken();
    const response = await axios.post(`/api/organization/${orgKey}/invite/`, {
      email,
      message,
    });
    return { orgKey, email };
  }
);

// Async thunk for deleting a member from an organization
export const deleteMember = createAsyncThunk(
  "organizations/deleteMember",
  async ({ orgKey, user }: { orgKey: string; user: string }) => {
    setCSRFToken();
    const response = await axios.delete(`/api/organizations/member/delete/`, {
      data: {
        organisation_id: orgKey,
        user_email: user,
      },
    });
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
        accepted: false,
      };
      if (!state.organizations[orgKey]) {
          state.organizations[orgKey] = { members: [], invitations: [] };
      }
      state.organizations[orgKey].invitations.push(newInvitation);
    },
    resetRefetch: (state) => {
      state.refetch = false;
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
        state.refetch = false;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch data.";
        state.loading = false;
        state.organizations = {};
      })
      .addCase(inviteMemberThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(inviteMemberThunk.fulfilled, (state, action) => {
        const { orgKey, email } = action.payload;
        if (!state.organizations[orgKey]) {
          state.organizations[orgKey] = { members: [], invitations: [] };
        }
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
