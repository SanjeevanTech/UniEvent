import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    // Check for preserved session
    const loadStorageData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('@user');
            const storedToken = await AsyncStorage.getItem('@token');
            
            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
            }
        }
        catch (e) {
            console.error('Failed to load storage data', e);
        }
        finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (!response.success) {
                return { success: false, message: response.message || 'Login failed' };
            }

            const { token, user: loggedInUser } = response.data || response;

            // Save to current session
            await AsyncStorage.setItem('@token', token);
            await AsyncStorage.setItem('@user', JSON.stringify(loggedInUser));
            setUser(loggedInUser);
            
            return { success: true };
        } catch (e) {
            console.error('Failed to login', e);
            return { success: false, message: 'Network or server error during login' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            
            if (!response.success) {
                return { success: false, message: response.message || 'Registration failed' };
            }

            const { token, user: registeredUser } = response.data || response;

            // Save session and log in immediately
            await AsyncStorage.setItem('@token', token);
            await AsyncStorage.setItem('@user', JSON.stringify(registeredUser));
            setUser(registeredUser);
            
            return { success: true };
        } catch (e) {
            console.error('Failed to register user', e);
            return { success: false, message: 'Network or server error during registration' };
        }
    };

    const updateUser = async (updatedData) => {
        try {
            const response = await api.put('/auth/profile', updatedData);
            
            if (!response.success) {
                return { success: false, message: response.message || 'Profile update failed' };
            }

            const updatedUser = response.data || response.user;

            await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            return { success: true };
        } catch (e) {
            console.error('Failed to update user data', e);
            return { success: false, message: 'Network or server error during profile update' };
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('@token');
            await AsyncStorage.removeItem('@user');
            setUser(null);
        } catch (e) {
            console.error('Failed to remove user data', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
