import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/Username and Password are required.' });
  }

  try {
    const db = getDB();
    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase().trim() }
      : { username: identifier.toLowerCase().trim() };

    const user = await db.collection('users').findOne(query);
    if (!user || user.password !== password)
      return res.status(401).json({ message: 'Invalid credentials.' });
    return res.status(200).json({
      message: 'Login successful',
      token: `token-${user._id}`,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, surname, email, password, confirmPassword, pronouns, username, bio, links } = req.body;

  if (!name || !surname || !email || !password || !username) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    const db = getDB();
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await db.collection('users').findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email is already registered.' });
    }

    const newUser = {
      username: cleanUsername,
      name,
      surname,
      email: cleanEmail,
      password,
      role: 'user',
      pronouns: pronouns || '',
      bio: bio || '',
      links: links || '',
      avatarUrl: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      token: `token-${result.insertedId}`,
      user: {
        id: result.insertedId,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering account', error: error.message });
  }
});

// GET /api/auth/profile/:username
router.get('/profile/:username', async (req, res) => {
  const targetUsername = req.params.username.toLowerCase();

  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ username: targetUsername });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const friendships = await db.collection('friends').find({
      $or: [{ userId1: user._id }, { userId2: user._id }],
      status: 'accepted'
    }).toArray();


    const friendUserIds = friendships.map((f) =>
      f.userId1.toString() === user._id.toString() ? f.userId2 : f.userId1
    );

    const friendDocs = await db.collection('users')
      .find({ _id: { $in: friendUserIds } })
      .project({ username: 1, name: 1, surname: 1, avatarUrl: 1 })
      .toArray();

    return res.status(200).json({
      id: user._id,
      username: user.username,
      name: `${user.name} ${user.surname}`.trim(),
      pronouns: user.pronouns || '',
      links: user.links || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      friends: friendDocs.map((f) => ({
        id: f._id,
        username: f.username,
        name: `${f.name} ${f.surname}`.trim()
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
});

// PUT /api/auth/profile/:id
router.put('/profile/:id', async (req, res) => {
  try {
    const db = getDB();
    const { name, pronouns, links, bio, avatarUrl } = req.body;
    console.log(avatarUrl);
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name,
          pronouns,
          links,
          bio,
          avatarUrl,
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

router.delete('/profile/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = getDB();
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { username: id.toLowerCase().trim() };

    const user = await db.collection('users').findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userId = user._id;    
    const userPosts = await db.collection('posts')
      .find({ userId })
      .project({ _id: 1 })
      .toArray();

    const userPostIds = userPosts.map((p) => p._id);
    if (userPostIds.length > 0) {
      await db.collection('comments').deleteMany({ postId: { $in: userPostIds } });
      await db.collection('likes').deleteMany({ postId: { $in: userPostIds } });
      await db.collection('reports').deleteMany({ postId: { $in: userPostIds } });
      await db.collection('albumPosts').deleteMany({ postId: { $in: userPostIds } });
    }
    
    await db.collection('comments').deleteMany({ userId });
    await db.collection('likes').deleteMany({ userId });
    
    await db.collection('posts').deleteMany({ userId });
    await db.collection('albums').deleteMany({ userId });
    
    await db.collection('friends').deleteMany({
      $or: [{ userId1: userId }, { userId2: userId }]
    });
    
    await db.collection('activities').deleteMany({
      $or: [{ actorId: userId }, { postId: { $in: userPostIds } }]
    });
    
    await db.collection('reports').deleteMany({ reporterId: userId });    
    await db.collection('users').deleteOne({ _id: userId });

    return res.status(200).json({ message: 'Account and associated data deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

export default router;