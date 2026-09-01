import { Router } from 'express';

const router = Router();

const users = [
  {
    id: '1',
    username: 'avian_chloe',
    name: 'Chloe Aris',
    pronouns: 'she/her',
    links: 'linktr.ee/avianchloe',
    bio: 'Bird watcher & wildlife photographer based in the Western Cape. Capturing fynbos endemics.',
    avatarUrl: '',
    friends: [
      { id: '2', username: 'raptor_hunter', name: 'Liam Vance' },
      { id: '3', username: 'sunbird_snaps', name: 'Nandi Sithole' },
      { id: '4', username: 'owl_scout', name: 'Sarah Finch' }
    ]
  },
  {
    id: '2',
    username: 'raptor_hunter',
    name: 'Liam Vance',
    pronouns: 'he/him',
    links: 'instagram.com/raptor_hunter',
    bio: 'Tracking birds of prey across Southern Africa. Raptor conservation advocate.',
    avatarUrl: '',
    friends: [
      { id: '1', username: 'avian_chloe', name: 'Chloe Aris' }
    ]
  },
  {
    id: '3',
    username: 'sunbird_snaps',
    name: 'Nandi Sithole',
    pronouns: 'they/them',
    links: 'nandisithole.photos',
    bio: 'Macro bird photography enthusiast. Obsessed with sunbirds and fynbos biodiversity.',
    avatarUrl: '',
    friends: [
      { id: '1', username: 'avian_chloe', name: 'Chloe Aris' }
    ]
  },
  {
    id: '4',
    username: 'owl_scout',
    name: 'Sarah Finch',
    pronouns: 'she/her',
    links: 'sarahfinch.co.za',
    bio: 'Nocturnal wildlife & owl acoustics researcher.',
    avatarUrl: '',
    friends: [
      { id: '1', username: 'avian_chloe', name: 'Chloe Aris' }
    ]
  }
];

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Email/Username and Password are required.' });
    }

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

router.get('/profile/:username', (req, res) => {
  const targetUsername = req.params.username.toLowerCase();
  const user = users.find((u) => u.username.toLowerCase() === targetUsername);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user);
});

export default router;