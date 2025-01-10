import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

//const API_BASE_URL = 'http://192.169.0.102:8000/api';
const API_BASE_URL = 'http://10.5.4.131:8000/api';
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo'
};

const TIMEOUT = 10000;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(new ApiError('Request failed', null, error))
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new ApiError('No refresh token found', 401);
        }

        const { data } = await axios.post(`${API_BASE_URL}/users/api/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access, user } = data;

        await Promise.all([
          SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access),
          SecureStore.setItemAsync(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
        ]);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await clearAuthStorage();
        throw new ApiError('Session expired', 401, refreshError);
      }
    }

    throw new ApiError(
      error.response?.data?.message || 'Request failed',
      error.response?.status,
      error.response?.data
    );
  }
);

const clearAuthStorage = async () => {
  await Promise.all(
    Object.values(STORAGE_KEYS).map(key => SecureStore.deleteItemAsync(key))
  );
};

const buildQueryParams = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  return params.toString();
};

export const propertyApi = {
  getAllProperties: async (filters = {}) => {
    try {
      const params = buildQueryParams({
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        property_type: filters.propertyType, // Change here
        listing_type: filters.listingType,
        city: filters.city,
        owner: filters.owner
      });
      const { data } = await axiosInstance.get(`/properties/properties/?${params}`);
      return data;
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError('Failed to fetch properties', null, error);
    }
  },


  getPropertyById: async (id) => {
    try {
      const { data } = await axiosInstance.get(`/properties/properties/${id}/`);
      return data;
    } catch (error) {
      throw new ApiError(`Failed to fetch property ${id}`, error.response?.status, error.response?.data);
    }
  },

  createProperty: async (propertyData) => {
    try {
      const { data } = await axiosInstance.post('/properties/properties/', propertyData);
      return data;
    } catch (error) {
      throw new ApiError('Failed to create property', error.response?.status, error.response?.data);
    }
  },

  updateProperty: async (id, propertyData) => {
    try {
      const { data } = await axiosInstance.put(`/properties/properties/${id}/`, propertyData);
      return data;
    } catch (error) {
      throw new ApiError(`Failed to update property ${id}`, error.response?.status, error.response?.data);
    }
  },

  deleteProperty: async (id) => {
    try {
      await axiosInstance.delete(`/properties/properties/${id}/`);
    } catch (error) {
      throw new ApiError(`Failed to delete property ${id}`, error.response?.status, error.response?.data);
    }
  },

  getPropertyTypes: async () => {
    try {
      const { data } = await axiosInstance.get('/properties/property-types/');
      return data;
    } catch (error) {
      throw new ApiError('Failed to fetch property types', error.response?.status, error.response?.data);
    }
  },

  createPropertyImage: async (formData) => {
    try {
      const { data } = await axiosInstance.post('/properties/property-images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (error) {
      throw new ApiError('Failed to upload image', error.response?.status, error.response?.data);
    }
  },

  deletePropertyImage: async (imageId) => {
    try {
      await axiosInstance.delete(`/properties/property-images/${imageId}/delete/`);
    } catch (error) {
      throw new ApiError(`Failed to delete image ${imageId}`, error.response?.status, error.response?.data);
    }
  },

  registerUser: async (payload) => {
    try {
      const { data } = await axiosInstance.post('users/users/', payload);
      return data;
    } catch (error) {
      throw new ApiError('User registration failed', error.response?.status, error.response?.data);
    }
  },

  loginUser: async (credentials) => {
    try {
      const { data } = await axiosInstance.post('/users/api/token/', credentials);
      const { access, refresh, user } = data;

      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, access),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refresh),
        SecureStore.setItemAsync(STORAGE_KEYS.USER_INFO, JSON.stringify(user))
      ]);

      return data;
    } catch (error) {
      throw new ApiError('Login failed', error.response?.status, error.response?.data);
    }
  },

  logoutUser: async () => {
    await clearAuthStorage();
  },

  validateToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch {
      return false;
    }
  },

  getFavorites: async () => {
    try {
      const { data } = await axiosInstance.get('/properties/favorites/');
      return data;
    } catch (error) {
      throw new ApiError('Failed to fetch favorites', error.response?.status, error.response?.data);
    }
  },

  addFavorite: async (propertyId) => {
    try {
      const { data } = await axiosInstance.post('/properties/favorites/', { property: propertyId });
      return data;
    } catch (error) {
      throw new ApiError('Failed to add favorite', error.response?.status, error.response?.data);
    }
  },

  removeFavorite: async (propertyId) => {
    try {
      await axiosInstance.delete(`/properties/favorites/${propertyId}/`);
    } catch (error) {
      throw new ApiError('Failed to remove favorite', error.response?.status, error.response?.data);
    }
  },


  updateProfile: async (formData) => {
      try {
        const { data } = await axiosInstance.put(
          `/users/users/${formData.get('id')}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Accept': 'application/json'
            },
            transformRequest: (data) => data, // Prevent axios from JSON stringifying the FormData
          }
        );
        return data;
      } catch (error) {
        throw new ApiError('Failed to update profile', error.response?.status, error.response?.data);
      }
    },


  changePassword: async (passwords) => {
    try {
      const { data } = await axiosInstance.post('/users/users/profile/change-password/', passwords);
      return data;
    } catch (error) {
      throw new ApiError('Failed to change password', error.response?.status, error.response?.data);
    }
  },

  postReview: async (review) => {
    try {
      const { data } = await axiosInstance.post('/reviews/reviews/', review);
      return data;
    } catch (error) {
      return error
    }
  },

  getReviews: async (product_id) => {
    try {
      const { data } = await axiosInstance.get(`/reviews/reviews/property/${product_id}/average-rating/`);
      return data;
    } catch (error) {
      throw new ApiError('Failed to load reviews', error.response?.status, error.response?.data);
    }
  }

};