import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';


interface FetchDataPreview {
    layer_id: number;
    page: number;
    page_size: number;
    count: number;
    data: any;
    columns: string[];
}


interface DataPreviewState {
    layer_id: number | null;
    layer_name: string | null;
    pageSize: number;
    page: number;
    count: number;
    data: any;
    columns: string[];
    status: 'idle' | 'loading' | 'success' | 'failed';
    error: string | null;
    search: string | null;
}

const initialState: DataPreviewState = {
    layer_id: null,
    layer_name: null,
    pageSize: 10,
    page: 1,
    count: 0,
    data: [],
    columns: [],
    status: 'idle',
    error: null,
    search: null
};

// Async thunk to fetch data preview
export const fetchDataPreview = createAsyncThunk(
    'dataPreview/fetchDataPreview',
    async ({ layer_id, page, page_size, search }: { layer_id: number, page: number, page_size: number, search: string | null }, { rejectWithValue }) => {
        try {
            let params: any = { page, page_size };
            if (search && search.length >= 3) {
                params.search = search;
            }
            const response = await axios.get(`/api/layer/${layer_id}/data-preview/`, {
                params: params
            });
            return response.data;
        } catch (error: any) {
            let error_msg = error.response?.data || 'Fetch data preview failed';
            if (typeof error_msg === 'object') {
                error_msg = Object.values(error_msg)[0];
            }
            return rejectWithValue(error_msg);
        }
    }
);

const dataPreviewSlice = createSlice({
    name: 'dataPreview',
    initialState,
    reducers: {
        resetState: (state) => {
            state.layer_id = null;
            state.layer_name = null;
            state.pageSize = 10;
            state.page = 1;
            state.count = 0;
            state.data = [];
            state.columns = [];
            state.status = 'idle';
            state.error = null;
            state.search = null;
        },
        setLayerId: (state, action: PayloadAction<{ layer_id: number, layer_name: string }>) => {
            state.layer_id = action.payload.layer_id;
            state.layer_name = action.payload.layer_name;
            state.pageSize = 10;
            state.page = 1;
            state.count = 0;
            state.data = [];
            state.columns = [];
            state.status = 'idle';
            state.error = null;
            state.search = null;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
            state.data = [];
            state.status = 'idle';
            state.error = null;
        },
        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
            state.page = 1;
            state.data = [];
            state.status = 'idle';
            state.error = null;
        },
        searchData: (state, action: PayloadAction<string>) => {
            state.search = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDataPreview.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchDataPreview.fulfilled, (state, action: PayloadAction<FetchDataPreview>) => {
                if (state.page !== action.payload.page) {
                    return;
                }
                state.layer_id = action.payload.layer_id;
                state.page = action.payload.page;
                state.pageSize = action.payload.page_size;
                state.count = action.payload.count;
                state.data = action.payload.data;
                state.columns = action.payload.columns;
                state.status = 'success';
            })
            .addCase(fetchDataPreview.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    }
});

export const { resetState, setLayerId, setPage, setPageSize, searchData } = dataPreviewSlice.actions;
export default dataPreviewSlice.reducer;
