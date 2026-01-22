import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

const AppStatusBar = () => {
    const { isDarkMode } = useTheme();
    return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
};

export default AppStatusBar;
