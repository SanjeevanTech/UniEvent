const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// @route   GET api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, location, description, type, image FROM events ORDER BY date ASC, time ASC"
    );
    
    // Map IDs to strings for frontend compatibility
    const events = result.rows.map(event => ({
      ...event,
      id: String(event.id)
    }));

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving events.' });
  }
});

// @route   GET api/events/registrations/my
// @desc    Get current user's registered events
// @access  Private
router.get('/registrations/my', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT e.id, e.title, TO_CHAR(e.date, 'YYYY-MM-DD') AS date, e.time, e.location, e.description, e.type, e.image 
       FROM events e 
       JOIN registrations r ON e.id = r.event_id 
       WHERE r.user_id = $1 
       ORDER BY e.date ASC`,
      [userId]
    );

    const registeredEvents = result.rows.map(event => ({
      ...event,
      id: String(event.id)
    }));

    res.json(registeredEvents);
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving your registrations.' });
  }
});

// @route   POST api/events
// @desc    Create an event
// @access  Private (Admin Only)
router.post('/', adminOnly, async (req, res) => {
  const { title, date, time, location, description, type, image } = req.body;

  if (!title || !date || !time || !location) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO events (title, date, time, location, description, type, image) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, location, description, type, image`,
      [title, date, time, location, description || '', type || 'Other', image || '']
    );

    const event = result.rows[0];
    event.id = String(event.id);

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error creating event.' });
  }
});

// @route   PUT api/events/:id
// @desc    Update an event
// @access  Private (Admin Only)
router.put('/:id', adminOnly, async (req, res) => {
  const eventId = req.params.id;
  const { title, date, time, location, description, type, image } = req.body;

  if (!title || !date || !time || !location) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
  }

  try {
    const result = await db.query(
      `UPDATE events 
       SET title = $1, date = $2, time = $3, location = $4, description = $5, type = $6, image = $7 
       WHERE id = $8 
       RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, location, description, type, image`,
      [title, date, time, location, description || '', type || 'Other', image || '', eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = result.rows[0];
    event.id = String(event.id);

    res.json({ success: true, event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error updating event.' });
  }
});

// @route   DELETE api/events/:id
// @desc    Delete an event
// @access  Private (Admin Only)
router.delete('/:id', adminOnly, async (req, res) => {
  const eventId = req.params.id;

  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING id', [eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting event.' });
  }
});

// @route   POST api/events/:id/register
// @desc    Register for an event
// @access  Private
router.post('/:id/register', auth, async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;

  try {
    // Check if event exists
    const eventCheck = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Check if already registered
    const regCheck = await db.query('SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
    if (regCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Already registered!' });
    }

    // Register user
    await db.query('INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);

    res.json({ success: true, message: 'Successfully registered!' });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ success: false, message: 'Server error registering for event.' });
  }
});

// @route   DELETE api/events/:id/unregister
// @desc    Unregister from an event
// @access  Private
router.delete('/:id/unregister', auth, async (req, res) => {
  const userId = req.user.id;
  const eventId = req.params.id;

  try {
    const result = await db.query(
      'DELETE FROM registrations WHERE user_id = $1 AND event_id = $2 RETURNING *',
      [userId, eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    res.json({ success: true, message: 'Removed from your events.' });
  } catch (error) {
    console.error('Unregister error:', error);
    res.status(500).json({ success: false, message: 'Server error during unregistration.' });
  }
});

// @route   POST api/events/reset
// @desc    Reset all events to default dummy data
// @access  Private (Admin Only)
router.post('/reset', adminOnly, async (req, res) => {
  try {
    // Begin transaction
    await db.query('BEGIN');

    // Delete registrations and events
    await db.query('DELETE FROM registrations');
    await db.query('DELETE FROM events');

    // Re-seed events
    const queryText = `
      INSERT INTO events (title, date, time, location, description, type, image) VALUES
      ('Modern Web Development Workshop', '2026-03-15', '10:00 AM', 'TCL1, Faculty of Technological Studies', 'Learn the latest trends in React and Node.js from industry experts.', 'Workshop', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'),
      ('Inter-Faculty Sports Meet', '2026-03-20', '08:00 AM', 'University Sports Ground', 'Annual sports competition between various faculties. Cheer for your team!', 'Sports', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80'),
      ('Tech Expo 2026', '2026-04-05', '09:00 AM', 'Technology Faculty TLH1', 'Showcasing innovative projects developed by technological studies students.', 'Exhibition', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'),
      ('Career Fair', '2026-04-12', '10:00 AM', 'Technology Faculty TLH2', 'Meet recruiters from top tech companies and explore job opportunities.', 'Networking', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80'),
      ('AI Ethics Seminar', '2026-04-18', '02:00 PM', 'Technology Faculty TCL1', 'A deep dive into the ethical implications of artificial intelligence in education.', 'Seminar', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'),
      ('Cultural Night 2026', '2026-05-10', '06:00 PM', 'Technology Faculty TLH1', 'Celebrate the diversity of our campus with performances, music, and food.', 'Cultural', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80')
    `;
    await db.query(queryText);

    await db.query('COMMIT');

    res.json({ success: true, message: 'App reset to default data' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Reset events error:', error);
    res.status(500).json({ success: false, message: 'Server error during database reset.' });
  }
});

module.exports = router;
