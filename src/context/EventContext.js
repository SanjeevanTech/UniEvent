import { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [completedEvents, setCompletedEvents] = useState([]);
    const { user } = useAuth();

    // Reload events/registrations whenever the user logs in or out
    useEffect(() => {
        loadEvents();
    }, [user]);

    const loadEvents = async () => {
        try {
            // 1. Fetch all events (Public)
            const eventsRes = await api.get('/events');
            if (eventsRes.success) {
                setEvents(eventsRes.data || []);
            }

            // 2. Fetch registrations (Private - only if user is logged in)
            if (user) {
                const registrationsRes = await api.get('/events/registrations/my');
                if (registrationsRes.success) {
                    const myRegistrations = registrationsRes.data || [];
                    
                    const today = new Date().toISOString().split('T')[0];
                    const active = [];
                    const completed = [];

                    myRegistrations.forEach(event => {
                        if (event.date < today) {
                            completed.push(event);
                        } else {
                            active.push(event);
                        }
                    });

                    setRegisteredEvents(active);
                    setCompletedEvents(completed);
                }
            } else {
                setRegisteredEvents([]);
                setCompletedEvents([]);
            }
        } catch (e) {
            console.error('Failed to load events from backend', e);
        }
    };

    const addEvent = async (newEvent) => {
        try {
            const response = await api.post('/events', newEvent);
            if (response.success) {
                const createdEvent = response.event || response.data?.event;
                if (createdEvent) {
                    setEvents(prev => [createdEvent, ...prev]);
                } else {
                    // Fallback to reload if response format differs
                    await loadEvents();
                }
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (e) {
            console.error('Failed to save event to backend', e);
            return { success: false, message: 'Server error saving event' };
        }
    };

    const deleteEvent = async (id) => {
        try {
            const response = await api.delete(`/events/${id}`);
            if (response.success) {
                setEvents(prev => prev.filter(e => e.id !== id));
                setRegisteredEvents(prev => prev.filter(e => e.id !== id));
                setCompletedEvents(prev => prev.filter(e => e.id !== id));
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (e) {
            console.error('Failed to delete event from backend', e);
            return { success: false, message: 'Server error deleting event' };
        }
    };

    const updateEvent = async (id, updatedData) => {
        try {
            const response = await api.put(`/events/${id}`, updatedData);
            if (response.success) {
                const updated = response.event || response.data?.event;
                if (updated) {
                    setEvents(prev => prev.map(e => e.id === id ? updated : e));
                    setRegisteredEvents(prev => prev.map(e => e.id === id ? updated : e));
                    setCompletedEvents(prev => prev.map(e => e.id === id ? updated : e));
                } else {
                    await loadEvents();
                }
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (e) {
            console.error('Failed to update event in backend', e);
            return { success: false, message: 'Server error updating event' };
        }
    };

    const registerForEvent = async (event) => {
        try {
            const response = await api.post(`/events/${event.id}/register`);
            if (response.success) {
                // Add to local state
                setRegisteredEvents(prev => {
                    if (prev.some(e => e.id === event.id)) return prev;
                    return [event, ...prev];
                });
                return { success: true, message: response.message || 'Successfully registered!' };
            }
            return { success: false, message: response.message || 'Registration failed' };
        } catch (e) {
            console.error('Failed to register in backend', e);
            return { success: false, message: 'Server error during registration' };
        }
    };

    const unregisterFromEvent = async (id) => {
        try {
            const response = await api.delete(`/events/${id}/unregister`);
            if (response.success) {
                setRegisteredEvents(prev => prev.filter(e => e.id !== id));
                setCompletedEvents(prev => prev.filter(e => e.id !== id));
                return { success: true, message: response.message || 'Removed from your events' };
            }
            return { success: false, message: response.message || 'Failed to remove' };
        } catch (e) {
            console.error('Failed to unregister in backend', e);
            return { success: false, message: 'Server error during unregistration' };
        }
    };

    const resetEvents = async () => {
        try {
            const response = await api.post('/events/reset');
            if (response.success) {
                await loadEvents();
                return { success: true, message: response.message || 'App reset to default data' };
            }
            return { success: false, message: response.message || 'Reset failed' };
        } catch (e) {
            console.error('Failed to reset events in backend', e);
            return { success: false, message: 'Server error during reset' };
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
