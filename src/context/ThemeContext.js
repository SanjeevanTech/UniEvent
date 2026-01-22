import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('@dark_mode');
            if (savedTheme !== null) {
                setIsDarkMode(JSON.parse(savedTheme));
            }
        } catch (e) {
            console.error('Failed to load theme', e);
        }
    };

    const toggleTheme = async () => {
        try {
            const newValue = !isDarkMode;
            setIsDarkMode(newValue);
            await AsyncStorage.setItem('@dark_mode', JSON.stringify(newValue));
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    const theme = {
        dark: isDarkMode,
        colors: {
            background: isDarkMode ? '#121212' : '#ffffff',
            surface: isDarkMode ? '#1e1e1e' : '#f8f9fa',
            text: isDarkMode ? '#ffffff' : '#333333',
            textSecondary: isDarkMode ? '#b0b0b0' : '#666666',
            primary: isDarkMode ? '#90caf9' : '#003366',
            border: isDarkMode ? '#333333' : '#eeeeee',
            card: isDarkMode ? '#242424' : '#ffffff',
            navBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
        }
    };

    const resetTheme = async () => {
        try {
            setIsDarkMode(false);
            await AsyncStorage.setItem('@dark_mode', JSON.stringify(false));
        } catch (e) {
            console.error('Failed to reset theme', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
