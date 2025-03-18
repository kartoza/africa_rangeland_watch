import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';


interface FetchDataPreview {
    layer_uuid: string;
    page: number;
    page_size: number;
    count: number;
    data: any;
    columns: string[];
}


interface DataPreviewState {
    layer_uuid: string | null;
    pageSize: number;
    page: number;
    count: number;
    data: any;
    columns: string[];
    status: 'idle' | 'loading' | 'success' | 'failed';
    error: string | null;
}

const initialState: DataPreviewState = {
    layer_uuid: null,
    pageSize: 10,
    page: 1,
    count: 0,
    data: [],
    columns: [],
    status: 'idle',
    error: null
};

// Async thunk to fetch data preview
export const fetchDataPreview = createAsyncThunk(
    'dataPreview/fetchDataPreview',
    async ({ layer_uuid, page, page_size }: { layer_uuid: string, page: number, page_size: number }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/frontend-api/data-preview/${layer_uuid}/`, {
                params: {
                    page,
                    page_size
                }
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
            state.layer_uuid = null;
            state.pageSize = 10;
            state.page = 1;
            state.count = 0;
            state.data = [];
            state.columns = [];
            state.status = 'idle';
            state.error = null;
        },
        setLayerUuid: (state, action: PayloadAction<string>) => {
            state.layer_uuid = action.payload;
            state.pageSize = 10;
            state.page = 1;
            state.count = 0;
            state.data = [];
            state.columns = [];
            state.status = 'idle';
            state.error = null;
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
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDataPreview.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchDataPreview.fulfilled, (state, action: PayloadAction<FetchDataPreview>) => {
                state.layer_uuid = action.payload.layer_uuid;
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

export const { resetState, setLayerUuid, setPage, setPageSize } = dataPreviewSlice.actions;
export default dataPreviewSlice.reducer;
