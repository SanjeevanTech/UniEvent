import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EVENTS as initialData } from '../data/dummyData';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState(initialData);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [completedEvents, setCompletedEvents] = useState([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const savedEvents = await AsyncStorage.getItem('@events');
            if (savedEvents) {
                setEvents(JSON.parse(savedEvents));
            }

            const savedRegistered = await AsyncStorage.getItem('@registered_events');
            let currentRegistered = savedRegistered ? JSON.parse(savedRegistered) : [];

            const savedCompleted = await AsyncStorage.getItem('@completed_events');
            let currentCompleted = savedCompleted ? JSON.parse(savedCompleted) : [];

            // Move past events from registered to completed
            const today = new Date().toISOString().split('T')[0];
            const stillActive = [];
            let newlyCompleted = false;

            currentRegistered.forEach(event => {
                if (event.date < today) {
                    // Check if already in completed to avoid duplicates
                    if (!currentCompleted.some(ce => ce.id === event.id)) {
                        currentCompleted.push(event);
                        newlyCompleted = true;
                    }
                } else {
                    stillActive.push(event);
                }
            });

            if (newlyCompleted) {
                await AsyncStorage.setItem('@completed_events', JSON.stringify(currentCompleted));
                await AsyncStorage.setItem('@registered_events', JSON.stringify(stillActive));
            }

            setRegisteredEvents(stillActive);
            setCompletedEvents(currentCompleted);
        } catch (e) {
            console.error('Failed to load events', e);
        }
    };

    const addEvent = async (newEvent) => {
        try {
            setEvents(prev => {
                const updated = [newEvent, ...prev];
                AsyncStorage.setItem('@events', JSON.stringify(updated));
                return updated;
            });
        } catch (e) {
            console.error('Failed to save event', e);
        }
    };

    const deleteEvent = async (id) => {
        try {
            setEvents(prev => {
                const updated = prev.filter(e => e.id !== id);
                AsyncStorage.setItem('@events', JSON.stringify(updated));
                return updated;
            });

            setRegisteredEvents(prev => {
                const updated = prev.filter(e => e.id !== id);
                AsyncStorage.setItem('@registered_events', JSON.stringify(updated));
                return updated;
            });
        } catch (e) {
            console.error('Failed to delete event', e);
        }
    };

    const updateEvent = async (id, updatedData) => {
        try {
            setEvents(prev => {
                const updated = prev.map(e => e.id === id ? { ...e, ...updatedData } : e);
                AsyncStorage.setItem('@events', JSON.stringify(updated));
                return updated;
            });

            setRegisteredEvents(prev => {
                const updated = prev.map(e => e.id === id ? { ...e, ...updatedData } : e);
                AsyncStorage.setItem('@registered_events', JSON.stringify(updated));
                return updated;
            });
        } catch (e) {
            console.error('Failed to update event', e);
        }
    };

    const registerForEvent = async (event) => {
        try {
            if (registeredEvents.some(e => e.id === event.id)) {
                return { success: false, message: 'Already registered!' };
            }
            const updated = [event, ...registeredEvents];
            setRegisteredEvents(updated);
            await AsyncStorage.setItem('@registered_events', JSON.stringify(updated));
            return { success: true, message: 'Successfully registered!' };
        } catch (e) {
            console.error('Failed to register', e);
            return { success: false, message: 'Registration failed' };
        }
    };

    const unregisterFromEvent = async (id) => {
        try {
            const updated = registeredEvents.filter(e => e.id !== id);
            setRegisteredEvents(updated);
            await AsyncStorage.setItem('@registered_events', JSON.stringify(updated));
            return { success: true, message: 'Removed from your events' };
        } catch (e) {
            console.error('Failed to unregister', e);
            return { success: false, message: 'Failed to remove' };
        }
    };

    const resetEvents = async () => {
        try {
            setEvents(initialData);
            setRegisteredEvents([]);
            setCompletedEvents([]);
            await AsyncStorage.setItem('@events', JSON.stringify(initialData));
            await AsyncStorage.setItem('@registered_events', JSON.stringify([]));
            await AsyncStorage.setItem('@completed_events', JSON.stringify([]));
            return { success: true, message: 'App reset to default data' };
        } catch (e) {
            console.error('Failed to reset events', e);
            return { success: false, message: 'Reset failed' };
        }
    };

    return (
        <EventContext.Provider value={{ events, registeredEvents, completedEvents, addEvent, deleteEvent, updateEvent, registerForEvent, unregisterFromEvent, resetEvents }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEvents = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvents must be used within an EventProvider');
    }
    return context;
};
