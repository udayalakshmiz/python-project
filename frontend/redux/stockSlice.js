import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Async thunks
export const fetchAllStocks = createAsyncThunk(
  'stocks/fetchAll',
  async () => {
    const response = await axios.get(`http://localhost:5001/api/stocks`);
    return response.data;
  }
);

export const fetchStockPrice = createAsyncThunk(
  'stocks/fetchPrice',
  async (stockId) => {
    const response = await axios.get(`${API_URL}/stocks/${stockId}/price`);
    return response.data;
  }
);

export const fetchStockDetails = createAsyncThunk(
  'stocks/fetchDetails',
  async (stockId) => {
    const response = await axios.get(`http://localhost:5001/api/stocks/${stockId}`);
    return response.data;
  }
);

// New action to refresh just the current price for alerts
export const refreshStockPrice = createAsyncThunk(
  'stocks/refreshStockPrice',
  async (stockId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/stocks/${stockId}/price`);
      return { stockId, currentPrice: response.data.currentPrice };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const stockSlice = createSlice({
  name: 'stocks',
  initialState: {
    companies: [],
    prices: {},
    selectedStock: null,
    loading: {
      companies: false,
      prices: {},
      details: false,
      price: false
    },
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchAllStocks
      .addCase(fetchAllStocks.pending, (state) => {
        state.loading.companies = true;
      })
      .addCase(fetchAllStocks.fulfilled, (state, action) => {
        state.companies = action.payload;
        state.loading.companies = false;
      })
      .addCase(fetchAllStocks.rejected, (state, action) => {
        state.loading.companies = false;
        state.error = action.error.message;
      })
      
      // Handle fetchStockPrice
      .addCase(fetchStockPrice.pending, (state, action) => {
        state.loading.prices[action.meta.arg] = true;
      })
      .addCase(fetchStockPrice.fulfilled, (state, action) => {
        state.prices[action.payload.id] = action.payload.price;
        state.loading.prices[action.payload.id] = false;
      })
      .addCase(fetchStockPrice.rejected, (state, action) => {
        state.loading.prices[action.meta.arg] = false;
        state.error = action.error.message;
      })
      
      // Handle fetchStockDetails
      .addCase(fetchStockDetails.pending, (state) => {
        state.loading.details = true;
      })
      .addCase(fetchStockDetails.fulfilled, (state, action) => {
        state.selectedStock = action.payload;
        state.loading.details = false;
      })
      .addCase(fetchStockDetails.rejected, (state, action) => {
        state.loading.details = false;
        state.error = action.error.message;
      })
      
      // Handle refreshStockPrice
      .addCase(refreshStockPrice.pending, (state) => {
        state.loading.price = true;
      })
      .addCase(refreshStockPrice.fulfilled, (state, action) => {
        state.loading.price = false;
        // If we have a selected stock and it matches the ID, update its current price
        if (state.selectedStock && state.selectedStock.id === action.payload.stockId) {
          state.selectedStock.currprice = action.payload.currentPrice;
        }
        // Also update in the stocks array if present
        const stockIndex = state.companies.findIndex(stock => stock.id === action.payload.stockId);
        if (stockIndex !== -1) {
          state.companies[stockIndex].currentPrice = action.payload.currentPrice;
        }
      })
      .addCase(refreshStockPrice.rejected, (state, action) => {
        state.loading.price = false;
        state.error = action.payload || 'Failed to refresh stock price';
      });
  }
});

export default stockSlice.reducer;
