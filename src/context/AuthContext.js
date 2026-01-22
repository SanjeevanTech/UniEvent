import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for preserved session
        const loadStorageData = async () => {
            try {
                // Initialize default admin if not exists
                const storedUsers = await AsyncStorage.getItem('@all_users');
                let users = storedUsers ? JSON.parse(storedUsers) : [];

                const adminEmail = 'admin@vau.ac.lk';
                const hasAdmin = users.some(u => u.email.toLowerCase() === adminEmail.toLowerCase());

                if (!hasAdmin) {
                    const defaultAdmin = {
                        id: 'admin_1',
                        name: 'System Admin',
                        email: adminEmail,
                        password: 'Admin123',
                        role: 'admin',
                        image: null
                    };
                    users.push(defaultAdmin);
                    await AsyncStorage.setItem('@all_users', JSON.stringify(users));
                }

                const storedUser = await AsyncStorage.getItem('@user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load storage data', e);
            } finally {
                setLoading(false);
            }
        };

        loadStorageData();
    }, []);

    const login = async (email, password) => {
        try {
            const storedUsers = await AsyncStorage.getItem('@all_users');
            const users = storedUsers ? JSON.parse(storedUsers) : [];

            // Find user by email (case-insensitive)
            const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

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
            if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                return { success: false, message: 'An account with this email already exists.' };
            }

            // Check if admin email for the first time
            const role = userData.email.toLowerCase() === 'admin@vau.ac.lk' ? 'admin' : 'student';
            const newUser = { ...userData, role };

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
            const newUser = { ...user, ...updatedData };
            await AsyncStorage.setItem('@user', JSON.stringify(newUser));

            // Also update in all_users registry
            const storedUsers = await AsyncStorage.getItem('@all_users');
            if (storedUsers) {
                let users = JSON.parse(storedUsers);
                const idx = users.findIndex(u => u.email === user.email);
                if (idx !== -1) {
                    users[idx] = newUser;
                    await AsyncStorage.setItem('@all_users', JSON.stringify(users));
                }
            }

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
