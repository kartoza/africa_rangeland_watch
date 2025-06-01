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


// Generate mock data
const generateMockItems = (page: number, limit: number, search: string = ''): Item[] => {
  const allItems: Item[] = [];
  const categories = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
  const types = ['Project', 'Task', 'Initiative', 'Campaign', 'Program'];
  const descriptions = [
    'High-priority project focused on user experience improvements',
    'Backend infrastructure optimization and scaling',
    'Mobile application development and testing',
    'Data analytics and reporting dashboard',
    'Security audit and compliance updates',
    'Customer support chatbot implementation',
    'Database migration and optimization',
    'API documentation and developer portal',
    'Performance monitoring and alerting system',
    'Content management system upgrade'
  ];

  // Generate 100 total items
  for (let i = 1; i <= 100; i++) {
    const category = categories[i % categories.length];
    const type = types[i % types.length];
    const name = `${type} ${category} ${i}`;
    const description = descriptions[i % descriptions.length];
    const date = new Date();
    date.setDate(date.getDate() - (i * 2)); // Each item is 2 days older
    date.setHours(9 + (i % 8), (i % 60), 0); // Varying times

    allItems.push({
      id: `item-${i}`,
      name,
      description,
      created_at: date.toISOString()
    });
  }

  // Filter by search term
  let filteredItems = allItems;
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    filteredItems = allItems.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  }

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return filteredItems.slice(startIndex, endIndex);
};

// Mock API function with pagination
const mockApiCall = ({ page, limit, search = '' }: FetchItemsParams): Promise<FetchItemsResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const items = generateMockItems(page, limit, search);
      
      // Calculate total items after filtering
      const allItems = generateMockItems(1, 1000, search); // Get all to count
      const totalItems = search.trim() ? 
        generateMockItems(1, 1000, search).length : 100;
      
      const totalPages = Math.ceil(totalItems / limit);
      const hasMore = page < totalPages;

      resolve({
        items,
        totalPages,
        currentPage: page,
        hasMore,
        totalItems
      });
    }, 800); // Simulate API delay
  });
};

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
const itemsSlice = createSlice({
  name: 'items',
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

export const { clearError, setSearchTerm, resetItems } = itemsSlice.actions;

export default itemsSlice.reducer;