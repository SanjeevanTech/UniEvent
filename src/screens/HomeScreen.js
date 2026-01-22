import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Platform, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_IMAGE = require('../../assets/images/default_event.png');

const HomeScreen = () => {
    const navigation = useNavigation();
    const { events, deleteEvent, resetEvents } = useEvents();
    const { user } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const isAdmin = user?.role === 'admin';
    const [notificationsVisible, setNotificationsVisible] = React.useState(false);
    const [notifications, setNotifications] = React.useState([
        { id: '1', title: 'New Event!', message: 'HackVau 2026 has been announced. Register now!', time: '2h ago', icon: 'flash' },
        { id: '2', title: 'Reminder', message: 'The Web Dev Workshop starts in 1 hour.', time: '1h ago', icon: 'time' },
        { id: '3', title: 'Event Update', message: 'Inter-Faculty Sports Meet venue changed to Main Ground.', time: '5h ago', icon: 'information-circle' },
    ]);
    const handleSync = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Sync with Code? This will update the list to match your dummyData.js file.')) {
                await resetEvents();
            }
        } else {
            Alert.alert('Sync with Code', 'Revert app data to match dummyData.js?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sync', onPress: () => resetEvents() }
            ]);
        }
    };

    const handleClearAll = () => {
        setNotifications([]);
    };

    const handleDelete = (id) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to delete this event?');
            if (confirmed) deleteEvent(id);
        } else {
            Alert.alert('Delete Event', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteEvent(id) }
            ]);
        }
    };

    const renderEventItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('EventDetails', { event: item })}
        >
            <Image
                source={item.image && typeof item.image === 'string' && item.image.startsWith('http') ? { uri: item.image } : DEFAULT_IMAGE}
                style={styles.cardImage}
            />
            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <View style={[styles.tagContainer, { backgroundColor: isDarkMode ? '#1a3a5a' : '#e6f2ff' }]}>
                        <Text style={[styles.tagText, { color: theme.colors.primary }]}>{item.type}</Text>
                    </View>
                    {isAdmin && (
                        <View style={styles.cardAdminActions}>
                            <TouchableOpacity onPress={() => navigation.navigate('AddEvent', { event: item })}>
                                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
                <View style={styles.infoRow}>
                    <View style={styles.iconInfo}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{item.date}</Text>
                    </View>
                    <View style={styles.iconInfo}>
                        <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{item.location.split(',')[0]}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Campus Events</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Discover what's happening</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                        {isAdmin && (
                            <TouchableOpacity onPress={handleSync} style={{ padding: 4 }}>
                                <Ionicons name="cloud-download-outline" size={28} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.notificationIcon}
                            onPress={() => setNotificationsVisible(true)}
                        >
                            <Ionicons name="notifications-outline" size={28} color={theme.colors.primary} />
                            {notifications.length > 0 && <View style={styles.notificationBadge} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={notificationsVisible}
                onRequestClose={() => setNotificationsVisible(false)}
            >
                <View style={styles.modalOverlay} accessibilityRole="none">
                    <View
                        style={[styles.notificationTray, { backgroundColor: theme.colors.card }]}
                        accessibilityViewIsModal={true}
                        accessibilityRole="none"
                    >
                        <View style={styles.trayHeader}>
                            <Text style={[styles.trayTitle, { color: theme.colors.text }]}>Notifications</Text>
                            <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                                <Ionicons name="close" size={28} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <View key={notification.id} style={[styles.notificationItem, { backgroundColor: theme.colors.surface }]}>
                                        <View style={[styles.notiIconBg, { backgroundColor: isDarkMode ? '#1a3a5a' : '#e6f2ff' }]}>
                                            <Ionicons name={notification.icon} size={20} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.notiContent}>
                                            <Text style={[styles.notiTitle, { color: theme.colors.text }]}>{notification.title}</Text>
                                            <Text style={[styles.notiMessage, { color: theme.colors.textSecondary }]}>{notification.message}</Text>
                                            <Text style={styles.notiTime}>{notification.time}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="notifications-off-outline" size={64} color={isDarkMode ? '#333' : '#ccc'} />
                                    <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>You're all caught up!</Text>
                                </View>
                            )}
                        </ScrollView>

                        {notifications.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearAllButton}
                                onPress={handleClearAll}
                            >
                                <Text style={[styles.clearAllText, { color: theme.colors.primary }]}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
            <FlatList
                data={events}
                renderItem={renderEventItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationIcon: {
        padding: 4,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 10,
        height: 10,
        backgroundColor: '#ff4444',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    listContent: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    cardImage: {
        width: '100%',
        height: 180,
    },
    cardContent: {
        padding: 16,
    },
    tagContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardAdminActions: {
        flexDirection: 'row',
        gap: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoText: {
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    notificationTray: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '60%',
        padding: 24,
    },
    trayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    trayTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    notificationItem: {
        flexDirection: 'row',
        marginBottom: 20,
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    notiIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notiContent: {
        flex: 1,
    },
    notiTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    notiMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    notiTime: {
        fontSize: 12,
        color: '#999',
    },
    clearAllButton: {
        marginTop: 10,
        padding: 16,
        alignItems: 'center',
    },
    clearAllText: {
        fontWeight: '600',
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyStateText: {
        fontSize: 16,
    },
});

export default HomeScreen;
