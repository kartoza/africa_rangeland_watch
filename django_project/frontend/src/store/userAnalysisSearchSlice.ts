// src/store/mockUserAnalysis.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { setCSRFToken } from "../utils/csrfUtils";

export interface Item {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  analysis_results?: any;
  raster_output_list?: any[];
}

interface FetchItemsParams {
  page: number;
  limit: number;
  search?: string;
}

interface FetchItemsResponse {
  items: Item[];
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
  totalItems: number;
}

interface ItemsState {
  items: Item[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  totalPages: number;
  totalItems: number;
  searchTerm: string;
}

// fetch user analysis results from API
const fetchUserAnalysisResults = async ({ page, limit, search = '' }: FetchItemsParams): Promise<FetchItemsResponse> => {
  const response = await axios.get(`/user_analysis_results/fetch?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch items: ${response.statusText}`);
  }
  return {
    items: response.data.results,
    totalPages: response.data.total_pages,
    currentPage: response.data.current_page,
    hasMore: response.data.current_page < response.data.total_pages,
    totalItems: response.data.count
  };
};

// Async thunk for fetching initial items
export const fetchItems = createAsyncThunk(
  'items/fetchItems',
  async ({ page = 1, limit = 10, search = '' }: Partial<FetchItemsParams>) => {
    const response = await fetchUserAnalysisResults({ page, limit, search });
    return { ...response, isInitial: page === 1 };
  }
);

// Async thunk for loading more items
export const loadMoreItems = createAsyncThunk(
  'items/loadMoreItems',
  async ({ page, limit = 10, search = '' }: FetchItemsParams) => {
    const response = await fetchUserAnalysisResults({ page, limit, search });
    return response;
  }
);

// Redux slice
const userAnalysisSearchSlice = createSlice({
  name: 'userAnalysisItems',
  initialState: {
    items: [],
    loading: false,
    loadingMore: false,
    error: null,
    currentPage: 0,
    hasMore: true,
    totalPages: 0,
    totalItems: 0,
    searchTerm: '',
  } as ItemsState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    resetItems: (state) => {
      state.items = [];
      state.currentPage = 0;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initial fetch
      .addCase(fetchItems.pending, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isInitial) {
          state.items = action.payload.items;
        } else {
          state.items = [...state.items, ...action.payload.items];
        }
        state.currentPage = action.payload.currentPage;
        state.hasMore = action.payload.hasMore;
        state.totalPages = action.payload.totalPages;
        state.totalItems = action.payload.totalItems;
        state.error = null;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch items';
      })
      // Load more
      .addCase(loadMoreItems.pending, (state) => {
        state.loadingMore = true;
        state.error = null;
      })
      .addCase(loadMoreItems.fulfilled, (state, action) => {
        state.loadingMore = false;
        state.items = [...state.items, ...action.payload.items];
        state.currentPage = action.payload.currentPage;
        state.hasMore = action.payload.hasMore;
        state.totalPages = action.payload.totalPages;
        state.totalItems = action.payload.totalItems;
        state.error = null;
      })
      .addCase(loadMoreItems.rejected, (state, action) => {
        state.loadingMore = false;
        state.error = action.error.message || 'Failed to load more items';
      });
  },
});

export const { clearError, setSearchTerm, resetItems } = userAnalysisSearchSlice.actions;

export default userAnalysisSearchSlice.reducer;