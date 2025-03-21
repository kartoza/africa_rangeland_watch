import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { add } from 'date-fns';


interface ExportLayerInterface {
    request_id: number;
    format: string;
    start_datetime: string;
    end_datetime: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    notes: string;
}

interface DownloadState {
    format: string;
    uuid_list: string[];
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DOWNLOADING';
    error: string | null;
    requestId: number;
}

const initialState: DownloadState = {
    format: 'shapefile',
    uuid_list: [],
    status: 'PENDING',
    error: null,
    requestId: null
};

// Async thunk for submitting a download request
export const submitDownloadRequest = createAsyncThunk(
  'export/layers',
  async ({uuid_list, format}: {uuid_list: string[], format: string}, { rejectWithValue }) => {
    try {
        const response = await axios.post(
            '/frontend-api/export-layer/submit/',
            {
                format: format,
                layers: uuid_list
            }
        );

        return response.data;
    } catch (error) {
        let error_msg = error.response?.data || 'Failed to submit download request';
        if (typeof error_msg === 'object') {
          error_msg = Object.values(error_msg)[0];
        }
        return rejectWithValue(error_msg);
    }
  }
);

// Async thunk to fetch background processing status
export const fetchExportStatus = createAsyncThunk(
    'export/fetchStatus',
    async (requestId: number, { dispatch, rejectWithValue }) => {
      try {
        const response = await axios.get(`/frontend-api/export-layer/status/${requestId}/`);

        if (response.data && response.data['status'] === 'COMPLETED') {
          dispatch(downloadFile({requestId, format: response.data['format']}));
        }

        return response.data;
      } catch (error: any) {
        let error_msg = error.response?.data || 'Failed to fetch status';
        if (typeof error_msg === 'object') {
          error_msg = Object.values(error_msg)[0];
        }
        return rejectWithValue(error_msg);
      }
    }
);

// Async thunk to download the file given a requestId
export const downloadFile = createAsyncThunk(
    'export/downloadFile',
    async ({requestId, format}: {requestId: number, format: string}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/frontend-api/export-layer/download/${requestId}/`, {
                responseType: 'blob' // Important for downloading files
            });

            // Create a URL for the file and trigger a download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const contentDisposition = response.headers['content-disposition'];
            let ext = 'zip'; // Default extension
            if (format === 'shapefile') {
                ext = 'zip';
            } else if (format === 'geopackage') {
                ext = 'gpkg';
            } else if (format === 'geojson') {
                ext = 'geojson';
            } else if (format === 'kml') {
                ext = 'kml';
            }
            let filename = `export_${requestId}.${ext}`; // Default filename

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match && match[1]) {
                    filename = match[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return null;
        } catch (error: any) {
            let error_msg = error.response?.data || 'Failed to download file';
            if (typeof error_msg === 'object') {
              error_msg = Object.values(error_msg)[0];
            }
            return rejectWithValue(error_msg);
        }
    }
);

// create a slice for the download state
const downloadSlice = createSlice({
  name: 'download',
  initialState,
  reducers: {
    resetState: (state) => {
        state.format = 'shapefile';
        state.uuid_list = [];
        state.status = 'PENDING';
        state.error = null;
        state.requestId = null;
    },
    setFormat: (state, action: PayloadAction<string>) => {
        state.format = action.payload;
    },
    setUuidList: (state, action: PayloadAction<string[]>) => {
        state.uuid_list = action.payload;
    },
    addUuid: (state, action: PayloadAction<string>) => {
        if (!state.uuid_list.includes(action.payload)) {
            state.uuid_list.push(action.payload);
        }
    },
    removeUuid: (state, action: PayloadAction<string>) => {
        state.uuid_list = state.uuid_list.filter(uuid => uuid !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitDownloadRequest.pending, (state) => {
        state.status = 'RUNNING';
        state.error = null;
      })
      .addCase(submitDownloadRequest.fulfilled, (state, action: PayloadAction<ExportLayerInterface>) => {
        state.requestId = action.payload.request_id;
      })
      .addCase(submitDownloadRequest.rejected, (state, action) => {
        state.status = 'FAILED';
        state.error = action.payload as string;
      })
      .addCase(fetchExportStatus.fulfilled, (state, action: PayloadAction<ExportLayerInterface>) => {
        state.status = action.payload.status === 'COMPLETED' ? 'DOWNLOADING' : action.payload.status;
        state.error = action.payload.notes;
      })
      .addCase(fetchExportStatus.rejected, (state, action) => {
        state.status = 'FAILED';
        state.error = action.payload as string;
      })
      .addCase(downloadFile.pending, (state) => {
        state.status = 'DOWNLOADING';
        state.error = null;
      })
      .addCase(downloadFile.fulfilled, (state) => {
        state.status = 'PENDING';
        state.requestId = null;
        state.error = null;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.status = 'FAILED';
        state.error = action.payload as string;
      });
  }
});

export const { resetState, setFormat, setUuidList, addUuid, removeUuid } = downloadSlice.actions;
export default downloadSlice.reducer;
