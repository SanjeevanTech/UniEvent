import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState(''); // This state is only used for registration
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const { theme, isDarkMode } = useTheme();

    const validatePassword = (pass) => {
        // At least 8 chars, 1 uppercase, 1 number
        const regex = /^(?=.*[0-9])(?=.*[A-Z]).{8,}$/;
        return regex.test(pass);
    };

    const handleSubmit = async () => {
        setError('');

        if (!isLogin && !name) {
            setError('Please enter your full name');
            return;
        }

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (!email.toLowerCase().endsWith('@vau.ac.lk')) {
            setError('Please use your university email (@vau.ac.lk)');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 chars with 1 uppercase and 1 number');
            return;
        }

        if (isLogin) {
            const result = await login(email, password);
            if (!result.success) {
                setError(result.message);
            }
        } else {
            const userData = {
                email,
                password,
                name,
                id: 'user_' + Math.random().toString(36).substr(2, 9)
            };
            const result = await register(userData);
            if (!result.success) {
                setError(result.message);
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: theme.colors.background }]}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.inner}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome to UniEvent</Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>University of Vavuniya</Text>
                        </View>

                        <View style={styles.form}>
                            {error ? (
                                <View style={[styles.errorBanner, { backgroundColor: isDarkMode ? '#442222' : '#fff0f0', borderColor: isDarkMode ? '#662222' : '#ffcccc' }]}>
                                    <Ionicons name="alert-circle" size={20} color="#ff4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {!isLogin && (
                                <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                    <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.colors.text }]}
                                        placeholder="Full Name"
                                        placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                        value={name}
                                        onChangeText={(text) => { setName(text); setError(''); }}
                                    />
                                </View>
                            )}

                            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text }]}
                                    placeholder="University Email"
                                    placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); setError(''); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text }]}
                                    placeholder="Password"
                                    placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                    value={password}
                                    onChangeText={(text) => { setPassword(text); setError(''); }}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color={theme.colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleSubmit}>
                                <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toggleContainer}
                                onPress={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                            >
                                <Text style={[styles.toggleText, { color: theme.colors.textSecondary }]}>
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                        {isLogin ? 'Sign Up' : 'Login'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        padding: 24,
        flex: 1,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoImage: {
        width: 120,
        height: 120,
        marginBottom: 16,
        borderRadius: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        gap: 8,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 10,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggleContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
    }
});

export default LoginScreen;
