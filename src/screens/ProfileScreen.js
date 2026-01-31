import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    TextInput,
    Alert,
    Switch,
    FlatList,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useEvents } from '../context/EventContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';


const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout, updateUser } = useAuth();
    const { theme, isDarkMode, toggleTheme, resetTheme } = useTheme();
    const { registeredEvents, completedEvents, unregisterFromEvent } = useEvents();

    // Modals State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [joinedEventsModalVisible, setJoinedEventsModalVisible] = useState(false);
    const [editedName, setEditedName] = useState(user?.name || '');
    const [editedEmail, setEditedEmail] = useState(user?.email || '');
    const [editedImage, setEditedImage] = useState(user?.image || '');

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: logout }
            ]
        );
    };

    const handleUpdateProfile = async () => {
        if (!editedName.trim() || !editedEmail.trim()) {
            Alert.alert("Error", "Name and Email are required.");
            return;
        }

        const result = await updateUser({
            name: editedName,
            email: editedEmail,
            image: editedImage
        });

        if (result.success) {
            setEditModalVisible(false);
            Alert.alert("Success", "Profile updated successfully!");
        } else {
            Alert.alert("Error", result.message);
        }
    };

    const handleUnregister = async (id, title) => {
        Alert.alert(
            "Remove Event",
            `Are you sure you want to unregister from "${title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const result = await unregisterFromEvent(id);
                        if (result.success) {
                            // Success logic handled by context update
                        }
                    }
                }
            ]
        );
    };

    const handleResetDefaults = () => {
        Alert.alert(
            "Reset to Defaults",
            "This will reset your theme settings to light mode. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    onPress: () => {
                        resetTheme();
                        Alert.alert("Success", "Theme reset to defaults.");
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <View style={styles.profileContainer}>
                <View style={[styles.avatarContainer, { borderColor: theme.colors.primary }]}>
                    <View style={styles.imageWrapper}>
                        {user?.image ? (
                            <Image source={{ uri: user.image }} style={styles.avatar} resizeMode="cover" />
                        ) : (
                            <View style={[styles.initialAvatar, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.initialText}>
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Ionicons name="pencil" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name}</Text>
                    <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                            {user?.role?.toUpperCase() || 'STUDENT'}
                        </Text>
                    </View>
                </View>
            </View>

            {user?.role !== 'admin' && (
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>{registeredEvents.length}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Registered</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>{completedEvents.length}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
                    </View>
                </View>
            )}
        </View>
    );

    const SettingItem = ({ icon, title, value, onValueChange, type = 'toggle', onPress, style }) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }, style]}
            onPress={onPress}
            disabled={type === 'toggle'}
        >
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name={icon} size={22} color={theme.colors.primary} />
                </View>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
            </View>
            {type === 'toggle' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: "#767577", true: theme.colors.primary + '80' }}
                    thumbColor={value ? theme.colors.primary : "#f4f3f4"}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderHeader()}

                {user?.role !== 'admin' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>MY ACTIVITY</Text>
                        <SettingItem
                            icon="eye-outline"
                            title="Joined Events"
                            type="button"
                            onPress={() => setJoinedEventsModalVisible(true)}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>PREFERENCES</Text>
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                    />
                    <SettingItem
                        icon="refresh-outline"
                        title="Reset to Defaults"
                        type="button"
                        onPress={handleResetDefaults}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SUPPORT & HELP</Text>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help Center"
                        type="button"
                        onPress={() => Alert.alert("Support", "Contact us at support@vau.ac.lk")}
                    />
                    <SettingItem
                        icon="chatbubble-ellipses-outline"
                        title="Feedback"
                        type="button"
                        onPress={() => Alert.alert("Feedback", "Thank you for your feedback!")}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        title="App Version"
                        type="button"
                        onPress={() => Alert.alert("About", "UniEvent v1.0.0\nDeveloped for Group 2")}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
                    <SettingItem
                        icon="person-outline"
                        title="Edit Profile"
                        type="button"
                        onPress={() => setEditModalVisible(true)}
                        style={{ marginTop: 10 }}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Privacy Policy"
                        type="button"
                        onPress={() => Alert.alert("Privacy Policy", "Your data is safe with us.")}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.logoutButton, { borderColor: '#ff4444' }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Made with for Group 2 Students</Text>
            </ScrollView>

            {/* Edit Profile Modal remains the same */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior='padding'
                        keyboardVerticalOffset={20}
                        style={{ width: '100%' }}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                                    <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Edit Profile</Text>
                                    <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
                                        <Ionicons name="close" size={28} color={theme.colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    bounces={false}
                                    contentContainerStyle={styles.modalScrollContent}
                                >
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Full Name</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                            value={editedName}
                                            onChangeText={setEditedName}
                                            placeholder="Enter your name"
                                            placeholderTextColor={theme.colors.textSecondary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Email Address</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                            value={editedEmail}
                                            onChangeText={setEditedEmail}
                                            placeholder="Enter your email"
                                            keyboardType="email-address"
                                            placeholderTextColor={theme.colors.textSecondary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Profile Image URL</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                            value={editedImage}
                                            onChangeText={setEditedImage}
                                            placeholder="https://example.com/image.jpg"
                                            placeholderTextColor={theme.colors.textSecondary}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                                        onPress={handleUpdateProfile}
                                    >
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            {/* Joined Events Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={joinedEventsModalVisible}
                onRequestClose={() => setJoinedEventsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card, height: '70%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>My Joined Events</Text>
                            <TouchableOpacity onPress={() => setJoinedEventsModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={registeredEvents}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={() => (
                                <View style={[styles.emptyEventsContainer, { marginTop: 40, borderStyle: 'dashed' }]}>
                                    <Ionicons name="calendar-outline" size={48} color={theme.colors.textSecondary} />
                                    <Text style={[styles.emptyEventsText, { color: theme.colors.textSecondary, fontSize: 16 }]}>
                                        You haven't joined any events yet.
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.saveButton, { backgroundColor: theme.colors.primary, paddingHorizontal: 30, height: 45, marginTop: 10 }]}
                                        onPress={() => {
                                            setJoinedEventsModalVisible(false);
                                            navigation.navigate('Home');
                                        }}
                                    >
                                        <Text style={styles.saveButtonText}>Explore Events</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <View style={[styles.joinedEventItem, { borderBottomColor: theme.colors.border }]}>
                                    <View style={styles.joinedEventInfo}>
                                        <Text style={[styles.joinedEventTitle, { color: theme.colors.text }]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={[styles.joinedEventDate, { color: theme.colors.textSecondary }]}>
                                            {item.date} • {item.location.split(',')[0]}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleUnregister(item.id, item.title)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#ff4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 10,
        borderBottomWidth: 1,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        padding: 2, // Space between border and image
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 90, // Fixed numeric dimension for mobile
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E1E1E1',
    },
    avatar: {
        width: 90,
        height: 90,
        backgroundColor: '#E1E1E1',
    },
    initialAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userInfo: {
        marginLeft: 20,
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 8,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '800',
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 24,
        paddingVertical: 10,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '100%',
    },
    myEventsSection: {
        marginTop: 24,
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    horizontalList: {
        paddingLeft: 24,
        paddingRight: 10,
    },
    eventSnippet: {
        width: 160,
        marginRight: 14,
        borderRadius: 15,
        borderWidth: 1,
        overflow: 'hidden',
    },
    snippetImage: {
        width: '100%',
        height: 100,
    },
    snippetContent: {
        padding: 10,
    },
    snippetTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    snippetDate: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    emptyEventsContainer: {
        marginHorizontal: 24,
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    emptyEventsText: {
        fontSize: 14,
        textAlign: 'center',
    },
    section: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginLeft: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 40,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 20,
        marginBottom: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(212, 207, 207, 0.5)',
        borderRadius: 20,
        justifyContent: 'flex-end',
        paddingTop: 60, // Ensures modal never hits the very top
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        maxHeight: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    modalScrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    closeButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    saveButton: {
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    joinedEventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    joinedEventInfo: {
        flex: 1,
        marginRight: 10,
    },
    joinedEventTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    joinedEventDate: {
        fontSize: 13,
        marginTop: 2,
    },
    removeButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#ff444415',
    },
});

export default ProfileScreen;
