-- Drop tables if they exist (useful for resetting database)
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100),
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Registrations table (Many-to-Many relationship between Users and Events)
CREATE TABLE registrations (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, event_id)
);

-- Seed initial events
INSERT INTO events (title, date, time, location, description, type, image) VALUES
('Modern Web Development Workshop', '2026-03-15', '10:00 AM', 'TCL1, Faculty of Technological Studies', 'Learn the latest trends in React and Node.js from industry experts.', 'Workshop', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'),
('Inter-Faculty Sports Meet', '2026-03-20', '08:00 AM', 'University Sports Ground', 'Annual sports competition between various faculties. Cheer for your team!', 'Sports', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=80'),
('Tech Expo 2026', '2026-04-05', '09:00 AM', 'Technology Faculty TLH1', 'Showcasing innovative projects developed by technological studies students.', 'Exhibition', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'),
('Career Fair', '2026-04-12', '10:00 AM', 'Technology Faculty TLH2', 'Meet recruiters from top tech companies and explore job opportunities.', 'Networking', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80'),
('AI Ethics Seminar', '2026-04-18', '02:00 PM', 'Technology Faculty TCL1', 'A deep dive into the ethical implications of artificial intelligence in education.', 'Seminar', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'),
('Cultural Night 2026', '2026-05-10', '06:00 PM', 'Technology Faculty TLH1', 'Celebrate the diversity of our campus with performances, music, and food.', 'Cultural', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80');
