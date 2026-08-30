import { Router } from 'express';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Email/Username and Password are required.' });
    }

    // Stubbed validation response
    if (password.length < 6) {
        return res.status(401).json({ message: 'Invalid credentials. Password too short.' });
    }

    return res.status(200).json({
        message: 'Login successful!',
        token: 'stubbed-jwt-token-12345',
        user: {
            id: 1,
            username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
            email: identifier.includes('@') ? identifier : `${identifier}@example.com`
        }
    });
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
    const { name, surname, email, password, confirmPassword, pronouns, username, bio, links } = req.body;

    if (!name || !surname || !email || !password || !username) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    return res.status(201).json({
        message: 'User registered successfully!',
        user: {
            id: Date.now(),
            name,
            surname,
            email,
            username,
            pronouns,
            bio,
            links
        }
    });
});

export default router;