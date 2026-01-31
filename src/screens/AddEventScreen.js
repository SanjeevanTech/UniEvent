import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const AddEventScreen = ({ route, navigation }) => {
    const editEvent = route.params?.event;
    const { user } = useAuth();
    const { addEvent, updateEvent } = useEvents();
    const { theme, isDarkMode } = useTheme();

    const parseTime = (timeStr, isEndTime = false) => {
        if (!timeStr) {
            const d = new Date();
            if (isEndTime) d.setHours(d.getHours() + 1);
            return d;
        }

        const parts = timeStr.split(' - ');
        const targetPart = (isEndTime && parts.length > 1) ? parts[1] : parts[0];

        try {
            const [time, modifier] = targetPart.split(' ');
            let [hours, minutes] = time.split(':');
            let hrs = parseInt(hours, 10);
            if (modifier === 'PM' && hrs < 12) hrs += 12;
            if (modifier === 'AM' && hrs === 12) hrs = 0;

            const d = new Date();
            d.setHours(hrs);
            d.setMinutes(parseInt(minutes, 10));
            d.setSeconds(0);
            return d;
        } catch (e) {
            const base = new Date();
            if (isEndTime) base.setHours(base.getHours() + 1);
            return base;
        }
    };

    const [title, setTitle] = useState(editEvent?.title || '');
    const [date, setDate] = useState(editEvent?.date ? new Date(editEvent.date) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Time States
    const [startTime, setStartTime] = useState(editEvent ? parseTime(editEvent.time) : new Date());
    const [endTime, setEndTime] = useState(editEvent ? parseTime(editEvent.time, true) : new Date(new Date().setHours(new Date().getHours() + 1)));
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const [location, setLocation] = useState(editEvent?.location || '');
    const [description, setDescription] = useState(editEvent?.description || '');
    const [type, setType] = useState(editEvent?.type || 'Workshop');
    const [isCustomType, setIsCustomType] = useState(false);
    const [customTypeName, setCustomTypeName] = useState('');
    const [availableTypes] = useState([
        'Workshop', 'Seminar', 'Sports', 'Cultural', 'Exhibition', 'Hackathon', 'Networking', 'Social'
    ]);

    React.useEffect(() => {
        if (editEvent) {
            setTitle(editEvent.title || '');
            setDate(editEvent.date ? new Date(editEvent.date) : new Date());
            setStartTime(parseTime(editEvent.time));
            setEndTime(parseTime(editEvent.time, true));
            setLocation(editEvent.location || '');
            setDescription(editEvent.description || '');

            if (!availableTypes.includes(editEvent.type)) {
                setIsCustomType(true);
                setCustomTypeName(editEvent.type);
                setType('Other');
            } else {
                setType(editEvent.type);
                setIsCustomType(false);
            }
        } else {
            setTitle('');
            setDate(new Date());
            setStartTime(new Date());
            setEndTime(new Date(new Date().setHours(new Date().getHours() + 1)));
            setLocation('');
            setDescription('');
            setType('Workshop');
            setIsCustomType(false);
            setCustomTypeName('');
        }
    }, [editEvent]);

    const isFormValid = title.trim() && location.trim() && description.trim();
    const hasChanges = () => {
        if (!editEvent) return isFormValid;

        const formattedDate = date.toISOString().split('T')[0];
        const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentTimeString = `${formattedStartTime} - ${formattedEndTime}`;
        const currentType = isCustomType ? customTypeName.trim() : type;

        return (
            title.trim() !== editEvent.title ||
            formattedDate !== editEvent.date ||
            (editEvent.time.includes(' - ') ? currentTimeString !== editEvent.time : formattedStartTime !== editEvent.time) ||
            location.trim() !== editEvent.location ||
            description.trim() !== editEvent.description ||
            currentType !== editEvent.type
        );
    };


    const canSubmit = editEvent ? hasChanges() : isFormValid;

    if (user?.role !== 'admin') {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
                <Ionicons name="lock-closed" size={64} color={isDarkMode ? '#333' : '#ccc'} />
                <Text style={{ fontSize: 18, color: theme.colors.textSecondary, marginTop: 16 }}>Access Denied</Text>
                <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Only Admins can post new events.</Text>
                <TouchableOpacity
                    style={{ marginTop: 24, padding: 12, backgroundColor: theme.colors.primary, borderRadius: 8 }}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back Home</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleAddEvent = () => {
        if (!title || !location || !description) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            Alert.alert('Invalid Date', 'You cannot post an event in the past.');
            return;
        }

        const formattedDate = date.toISOString().split('T')[0];
        const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const eventData = {
            title,
            date: formattedDate,
            time: `${formattedStartTime} - ${formattedEndTime}`,
            location,
            description,
            type: isCustomType ? (customTypeName || 'Other') : type,
            image: editEvent?.image || null,
        };

        const clearForm = () => {
            setTitle('');
            setDate(new Date());
            setStartTime(new Date());
            setEndTime(new Date());
            setLocation('');
            setDescription('');
            setType('Workshop');
            setIsCustomType(false);
            setCustomTypeName('');
        };

        if (editEvent) {
            updateEvent(editEvent.id, eventData);
            Alert.alert('Success', 'Event updated successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.navigate('Home');
                    }
                }
            ]);
        } else {
            addEvent({
                id: 'evt_' + Math.random().toString(36).substr(2, 9),
                ...eventData,
            });
            Alert.alert('Success', 'Event added successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        clearForm();
                        navigation.navigate('Home');
                    }
                }
            ]);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.userHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
                        <View>
                            <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.name}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.title, { color: theme.colors.primary }]}>{editEvent ? 'Edit Event' : 'Add New Event'}</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {editEvent ? 'Update the details below' : 'Fill in the details to host a new event'}
                    </Text>

                    <View style={styles.form}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Event Title</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="e.g., AI Research Seminar"
                            placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={[styles.label, { color: theme.colors.text }]}>Date</Text>
                        {Platform.OS === 'web' ? (
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                onChangeText={(text) => {
                                    const d = new Date(text);
                                    if (!isNaN(d.getTime())) setDate(d);
                                }}
                                defaultValue={date.toISOString().split('T')[0]}
                            />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.datePickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                                    <Text style={[styles.datePickerButtonText, { color: theme.colors.text }]}>
                                        {date.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display='default'
                                        onChange={(selectedDate) => {
                                            setShowDatePicker(false);
                                            if (selectedDate) setDate(selectedDate);
                                        }}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </>
                        )}

                        <View style={styles.timeRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>Start Time</Text>
                                {Platform.OS === 'web' ? (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                                        placeholder="HH:MM"
                                        placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                        onChangeText={(text) => {
                                            const [h, m] = text.split(':');
                                            if (h && m) {
                                                const newTime = new Date();
                                                newTime.setHours(parseInt(h), parseInt(m));
                                                setStartTime(newTime);
                                            }
                                        }}
                                        defaultValue={startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.datePickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                        onPress={() => setShowStartTimePicker(true)}
                                    >
                                        <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                                        <Text style={[styles.datePickerButtonText, { color: theme.colors.text }]}>
                                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.colors.text }]}>End Time</Text>
                                {Platform.OS === 'web' ? (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                                        placeholder="HH:MM"
                                        placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                        onChangeText={(text) => {
                                            const [h, m] = text.split(':');
                                            if (h && m) {
                                                const newTime = new Date();
                                                newTime.setHours(parseInt(h), parseInt(m));
                                                setEndTime(newTime);
                                            }
                                        }}
                                        defaultValue={endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.datePickerButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                        onPress={() => setShowEndTimePicker(true)}
                                    >
                                        <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                                        <Text style={[styles.datePickerButtonText, { color: theme.colors.text }]}>
                                            {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {showStartTimePicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                display="default"
                                onChange={(selectedTime) => {
                                    setShowStartTimePicker(false);
                                    if (selectedTime) setStartTime(selectedTime);
                                }}
                            />
                        )}

                        {showEndTimePicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={endTime}
                                mode="time"
                                display="default"
                                onChange={(selectedTime) => {
                                    setShowEndTimePicker(false);
                                    if (selectedTime) setEndTime(selectedTime);
                                }}
                            />
                        )}

                        <Text style={[styles.label, { color: theme.colors.text }]}>Location</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="e.g., Hall 01"
                            placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={[styles.label, { color: theme.colors.text }]}>Event Type</Text>
                        <View style={styles.typeContainer}>
                            {availableTypes.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeButton, { borderColor: theme.colors.primary }, type === t && !isCustomType && { backgroundColor: theme.colors.primary }]}
                                    onPress={() => {
                                        setType(t);
                                        setIsCustomType(false);
                                    }}
                                >
                                    <Text style={[styles.typeButtonText, { color: theme.colors.primary }, type === t && !isCustomType && { color: '#fff' }]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.typeButton, { borderColor: theme.colors.primary }, isCustomType && { backgroundColor: theme.colors.primary }]}
                                onPress={() => setIsCustomType(!isCustomType)}
                            >
                                <Ionicons name="add" size={20} color={isCustomType ? "#fff" : theme.colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {isCustomType && (
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                                placeholder="Enter custom event type..."
                                placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                                value={customTypeName}
                                onChangeText={setCustomTypeName}
                                autoFocus
                            />
                        )}

                        <Text style={[styles.label, { color: theme.colors.text }]}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                            placeholder="Describe the event..."
                            placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: canSubmit ? theme.colors.primary : (isDarkMode ? '#333' : '#ccc') }
                            ]}
                            onPress={handleAddEvent}
                            disabled={!canSubmit}
                        >
                            <Text style={[styles.buttonText, !canSubmit && { color: isDarkMode ? '#666' : '#fff' }]}>
                                {editEvent ? 'Update Event' : 'Post Event'}
                            </Text>
                        </TouchableOpacity>
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
    scrollContent: {
        padding: 24,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
        borderWidth: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    roleBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        padding: 14,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        gap: 12,
    },
    datePickerButtonText: {
        fontSize: 16,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 16,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 10,
    },
    typeButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        minWidth: '28%',
    },
    typeButtonText: {
        fontWeight: '600',
    },
    button: {
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AddEventScreen;
