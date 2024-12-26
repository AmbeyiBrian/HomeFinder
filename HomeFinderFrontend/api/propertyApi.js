import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

//const API_BASE_URL = 'http://10.5.4.131:8000/api';
const API_BASE_URL = 'http://192.169.0.100:8000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/users/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await SecureStore.setItemAsync('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        throw refreshError;
      }
    }
    return Promise.reject(error);
  }
);

export const propertyApi = {
  // Properties
  getAllProperties: async (filters = {}) => {
    try {
      const {
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        propertyType,
        listingType,
        city
      } = filters;

      const params = new URLSearchParams();

      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (bedrooms) params.append('bedrooms', bedrooms);
      if (bathrooms) params.append('bathrooms', bathrooms);
      if (propertyType) params.append('property_type', propertyType);
      if (listingType) params.append('listing_type', listingType);
      if (city) params.append('city', city);

      const response = await axiosInstance.get(`/properties/properties/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error.response?.data || error.message);
      throw error;
    }
  },

  getPropertyById: async (id) => {
    try {
      const response = await axiosInstance.get(`/properties/properties/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching property:', error.response?.data || error.message);
      throw error;
    }
  },

  createProperty: async (propertyData) => {
    try {
      const response = await axiosInstance.post('/properties/properties/', propertyData);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error.response?.data || error.message);
      throw error;
    }
  },

  updateProperty: async (id, propertyData) => {
    try {
      const response = await axiosInstance.put(`/properties/properties/${id}/`, propertyData);
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteProperty: async (id) => {
    try {
      await axiosInstance.delete(`/properties/properties/${id}/`);
    } catch (error) {
      console.error('Error deleting property:', error.response?.data || error.message);
      throw error;
    }
  },

  // Property Types
  getPropertyTypes: async () => {
    try {
      const response = await axiosInstance.get('/properties/property-types/');
      return response.data;
    } catch (error) {
      console.error('Error fetching property types:', error.response?.data || error.message);
      throw error;
    }
  },

  // Property Images
  createPropertyImage: async (formData) => {
    try {
      const response = await axiosInstance.post('/properties/property-images/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error.response?.data || error.message);
      throw error;
    }
  },

  deletePropertyImage: async (imageId) => {
    try {
      await axiosInstance.delete(`/properties/property-images/${imageId}/delete/`);
    } catch (error) {
      console.error('Error deleting image:', error.response?.data || error.message);
      throw error;
    }
  },

  //User Registration
  registerUser: async (payload)=>{
    try{
        const response = await axiosInstance.post('users/users/', payload);
    }
    catch{
      console.error('User registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Authentication
  loginUser: async (credentials) => {
    try {
      const response = await axiosInstance.post('/users/api/token/', credentials);
      const { access, refresh, user } = response.data;

      await SecureStore.setItemAsync('accessToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      if (user) {
        await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  logoutUser: async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken')
      await SecureStore.deleteItemAsync('userInfo')
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('No refresh token found');

      const response = await axios.post(`${API_BASE_URL}/users/api/token/refresh/`, {
        refresh: refreshToken,
      });

    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('No refresh token found');

      const response = await axios.post(`${API_BASE_URL}/users/api/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      await SecureStore.setItemAsync('accessToken', access);
      return access;
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Add this to the propertyApi object
validateToken: async () => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) throw new Error('No access token found');

    const response = await axiosInstance.post('/users/api/token/verify/', {
      token: token
    });

    return true; // Token is valid if no error is thrown
  } catch (error) {
    console.error('Token validation error:', error.response?.data || error.message);
    return false; // Token is invalid
  }
},

// Favorites
  getFavorites: async () => {
    try {
      const response = await axiosInstance.get('/properties/favorites/');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorites:', error.response?.data || error.message);
      throw error;
    }
  },

  addFavorite: async (propertyId) => {
    try {
      const response = await axiosInstance.post('/properties/favorites/', { property: propertyId });
      return response.data;
    } catch (error) {
      console.error('Error adding favorite:', error.response?.data || error.message);
      throw error;
    }
  },

  removeFavorite: async (propertyId) => {
    try {
      await axiosInstance.delete(`/properties/favorites/${propertyId}/`);
    } catch (error) {
      console.error('Error removing favorite:', error.response?.data || error.message);
      throw error;
    }
  },
};