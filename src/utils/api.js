import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Set this to your computer's local IP address if testing on a physical mobile device
// Example: '192.168.1.100'
const LOCAL_IP = 'localhost';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special IP that redirects to the host loopback from the Android Emulator
    return 'http://10.0.2.2:5000/api';
  }
  return `http://${LOCAL_IP}:5000/api`;
};

const API_BASE_URL = getBaseUrl();

export const api = {
  async request(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('@token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };

      const config = {
        ...options,
        headers
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      // Handle delete or empty responses
      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Something went wrong',
          status: response.status
        };
      }

      // If data already contains a 'success' field, return it, otherwise return standard format
      if (data && typeof data === 'object' && 'success' in data) {
        return data;
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      return {
        success: false,
        message: 'Network error. Please make sure the backend server is running.'
      };
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};
