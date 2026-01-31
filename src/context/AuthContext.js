import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();
const defaultAdmin = {
    id: 'admin',
    name: 'System Admin',
    email: 'admin@vau.ac.lk',
    password: 'Admin123',
    role: 'admin',
    image: null
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    // Check for preserved session
    const loadStorageData = async () => {
        try {
            const storedAllUsers = await AsyncStorage.getItem('@all_users');
            if (!storedAllUsers) {
                // If empty, save the admin in an ARRAY [ ]
                await AsyncStorage.setItem('@all_users', JSON.stringify([defaultAdmin]));
            }

            const storedUser = await AsyncStorage.getItem('@user');
            if (storedUser) {
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
            const storedUsers = await AsyncStorage.getItem('@all_users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];

            // Find user by email (case-insensitive)
            const existingUser = users.find(u => u.email === email);

            if (!existingUser) {
                return { success: false, message: 'No account found with this email. Please sign up.' };
            }

            if (existingUser.password !== password) {
                return { success: false, message: 'Incorrect password.' };
            }

            // Save to current session
            await AsyncStorage.setItem('@user', JSON.stringify(existingUser));
            setUser(existingUser);
            return { success: true };
        } catch (e) {
            console.error('Failed to login', e);
            return { success: false, message: 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const storedUsers = await AsyncStorage.getItem('@all_users');
            let users = storedUsers ? JSON.parse(storedUsers) : [];

            // Check if email already exists
            if (users.some(u => u.email === userData)) {
                return { success: false, message: 'An account with this email already exists.' };
            }

            const newUser = { ...userData, role: 'student' };

            // Add new user
            users.push(newUser);
            await AsyncStorage.setItem('@all_users', JSON.stringify(users));

            // Log them in immediately after registration
            await AsyncStorage.setItem('@user', JSON.stringify(newUser));
            setUser(newUser);
            return { success: true };
        } catch (e) {
            console.error('Failed to register user', e);
            return { success: false, message: 'Registration failed' };
        }
    };

    const updateUser = async (updatedData) => {
        try {
            const storedUsers = await AsyncStorage.getItem('@all_users');
            let users = storedUsers ? JSON.parse(storedUsers) : [];

            // Check if email already exists (if email is being changed)
            if (updatedData.email && updatedData.email !== user.email) {
                const emailExists = users.some(u => u.email === updatedData.email);
                if (emailExists) {
                    return { success: false, message: 'Email already in use' };
                }
            }

            const newUser = { ...user, ...updatedData };
            await AsyncStorage.setItem('@user', JSON.stringify(newUser));

            // Also update in all_users registry
            const updatedUsers = users.map(u => u.email === user.email ? newUser : u);
            await AsyncStorage.setItem('@all_users', JSON.stringify(updatedUsers));

            setUser(newUser);
            return { success: true };
        } catch (e) {
            console.error('Failed to update user data', e);
            return { success: false, message: 'Failed to update profile' };
        }
    };

    const logout = async () => {
        try {
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
