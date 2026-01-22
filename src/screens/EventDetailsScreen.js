import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_IMAGE = require('../../assets/images/default_event.png');

const EventDetailsScreen = ({ route, navigation }) => {
    const { event: initialEvent } = route.params;
    const { user } = useAuth();
    const { events, deleteEvent, registerForEvent, registeredEvents } = useEvents();

    // Find the current version of this event from context to ensure real-time updates
    const event = events.find(e => e.id === initialEvent.id) || initialEvent;
    const { theme, isDarkMode } = useTheme();

    const isAdmin = user?.role === 'admin';
    const isJoined = registeredEvents.some(e => e.id === event.id);

    const handleRegister = async () => {
        const result = await registerForEvent(event);
        if (Platform.OS === 'web') {
            alert(result.message);
        } else {
            Alert.alert(result.success ? 'Success' : 'Notice', result.message);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Event',
            'Are you sure you want to delete this event?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteEvent(event.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const handleEdit = () => {
        navigation.navigate('AddEvent', { event });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                    source={event.image && typeof event.image === 'string' && event.image.startsWith('http') ? { uri: event.image } : DEFAULT_IMAGE}
                    style={styles.image}
                />

                <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.headerRow}>
                        <View style={[styles.tag, { backgroundColor: isDarkMode ? '#1a3a5a' : '#e6f2ff' }]}>
                            <Text style={[styles.tagText, { color: theme.colors.primary }]}>{event.type}</Text>
                        </View>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="close-circle" size={32} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>

                    <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={24} color={theme.colors.primary} style={styles.detailIcon} />
                        <View>
                            <Text style={styles.detailLabel}>Date & Time</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{event.date} at {event.time}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="location" size={24} color={theme.colors.primary} style={styles.detailIcon} />
                        <View>
                            <Text style={styles.detailLabel}>Location</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{event.location}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{event.description}</Text>

                    {isAdmin ? (
                        <View style={styles.adminControls}>
                            <TouchableOpacity style={[styles.controlButton, styles.editButton, { backgroundColor: theme.colors.primary }]} onPress={handleEdit}>
                                <Ionicons name="create" size={24} color="#fff" />
                                <Text style={styles.controlButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlButton, styles.deleteButton]} onPress={handleDelete}>
                                <Ionicons name="trash" size={24} color="#fff" />
                                <Text style={styles.controlButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.registerButton, { backgroundColor: theme.colors.primary }, isJoined && styles.joinedButton]}
                            onPress={isJoined ? null : handleRegister}
                            activeOpacity={isJoined ? 1 : 0.7}
                        >
                            <Ionicons name={isJoined ? "checkmark-circle" : "calendar-outline"} size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.registerButtonText}>
                                {isJoined ? 'Joined' : 'Register for Event'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: 300,
    },
    content: {
        padding: 20,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontWeight: 'bold',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailIcon: {
        marginRight: 16,
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    registerButton: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    joinedButton: {
        backgroundColor: '#6c757d',
    },
    adminControls: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    controlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        gap: 8,
    },
    editButton: {
    },
    deleteButton: {
        backgroundColor: '#cc0000',
    },
    controlButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EventDetailsScreen;
