import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

// GET /api/friends/status?user1=alice&user2=bob
router.get('/status', async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Both user1 and user2 query parameters are required.' });
  }

  try {
    const db = getDB();

    const [u1, u2] = await Promise.all([
      db.collection('users').findOne({ username: user1.toLowerCase().trim() }),
      db.collection('users').findOne({ username: user2.toLowerCase().trim() })
    ]);

    if (!u1 || !u2) {
      return res.status(200).json({ status: 'Not Friends' });
    }

    const friendship = await db.collection('friends').findOne({
      $or: [
        { userId1: u1._id, userId2: u2._id },
        { userId1: u2._id, userId2: u1._id }
      ]
    });

    if (!friendship) {
      return res.status(200).json({ status: 'Not Friends' });
    }

    if (friendship.status === 'accepted') {
      return res.status(200).json({ status: 'Friends', friendshipId: friendship._id });
    }

    if (friendship.status === 'pending') {
      const isSender = friendship.userId1.toString() === u1._id.toString();
      return res.status(200).json({
        status: isSender ? 'Friend Request Pending' : 'Received Request',
        friendshipId: friendship._id
      });
    }

    return res.status(200).json({ status: 'Not Friends' });
  } catch (error) {
    console.error('Error fetching friendship status:', error);
    return res.status(500).json({ message: 'Error fetching friendship status', error: error.message });
  }
});

// GET /api/friends/requests?user=username
router.get('/requests', async (req, res) => {
  const { user: username } = req.query;

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }

  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Pending requests where user is the receiver (userId2)
    const requests = await db.collection('friends').aggregate([
      {
        $match: {
          userId2: user._id,
          status: 'pending'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId1',
          foreignField: '_id',
          as: 'sender'
        }
      },
      { $unwind: '$sender' },
      {
        $project: {
          id: '$_id',
          senderId: '$sender._id',
          username: '$sender.username',
          name: '$sender.name',
          avatarUrl: '$sender.avatarUrl',
          createdAt: 1
        }
      }
    ]).toArray();

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return res.status(500).json({ message: 'Error retrieving friend requests', error: error.message });
  }
});

// POST /api/friends/request
router.post('/request', async (req, res) => {
  const { sender, recipient } = req.body;

  if (!sender || !recipient) {
    return res.status(400).json({ message: 'Sender and recipient usernames are required.' });
  }

  if (sender.toLowerCase().trim() === recipient.toLowerCase().trim()) {
    return res.status(400).json({ message: 'Cannot send a friend request to yourself.' });
  }

  try {
    const db = getDB();

    const [u1, u2] = await Promise.all([
      db.collection('users').findOne({ username: sender.toLowerCase().trim() }),
      db.collection('users').findOne({ username: recipient.toLowerCase().trim() })
    ]);

    if (!u1 || !u2) {
      return res.status(404).json({ message: 'One or both users not found.' });
    }

    const existing = await db.collection('friends').findOne({
      $or: [
        { userId1: u1._id, userId2: u2._id },
        { userId1: u2._id, userId2: u1._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends.' });
      }
      return res.status(400).json({ message: 'A friend request is already pending.' });
    }

    const newRequest = {
      userId1: u1._id,
      userId2: u2._id,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('friends').insertOne(newRequest);

    return res.status(201).json({
      message: 'Friend request sent.',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ message: 'Error sending friend request', error: error.message });
  }
});

// POST /api/friends/accept
router.post('/accept', async (req, res) => {
  const { requestId, sender, recipient } = req.body;

  try {
    const db = getDB();
    let filter = {};

    if (requestId && ObjectId.isValid(requestId)) {
      filter = { _id: new ObjectId(requestId), status: 'pending' };
    } else if (sender && recipient) {
      const [u1, u2] = await Promise.all([
        db.collection('users').findOne({ username: sender.toLowerCase().trim() }),
        db.collection('users').findOne({ username: recipient.toLowerCase().trim() })
      ]);
      if (!u1 || !u2) return res.status(404).json({ message: 'Users not found.' });

      filter = {
        userId1: u1._id,
        userId2: u2._id,
        status: 'pending'
      };
    } else {
      return res.status(400).json({ message: 'Provide requestId or both sender and recipient.' });
    }

    const request = await db.collection('friends').findOne(filter);
    if (!request) {
      return res.status(404).json({ message: 'Pending friend request not found.' });
    }

    const now = new Date();
    await db.collection('friends').updateOne(
      { _id: request._id },
      { $set: { status: 'accepted', updatedAt: now } }
    );

    return res.status(200).json({ message: 'Friend request accepted.' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ message: 'Error accepting friend request', error: error.message });
  }
});

// POST /api/friends/decline
router.post('/decline', async (req, res) => {
  const { requestId, sender, recipient } = req.body;

  try {
    const db = getDB();
    let filter = {};

    if (requestId && ObjectId.isValid(requestId)) {
      filter = { _id: new ObjectId(requestId), status: 'pending' };
    } else if (sender && recipient) {
      const [u1, u2] = await Promise.all([
        db.collection('users').findOne({ username: sender.toLowerCase().trim() }),
        db.collection('users').findOne({ username: recipient.toLowerCase().trim() })
      ]);
      if (!u1 || !u2) return res.status(404).json({ message: 'Users not found.' });

      filter = {
        $or: [
          { userId1: u1._id, userId2: u2._id },
          { userId1: u2._id, userId2: u1._id }
        ],
        status: 'pending'
      };
    } else {
      return res.status(400).json({ message: 'Provide requestId or both sender and recipient.' });
    }

    const result = await db.collection('friends').deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Pending request not found.' });
    }

    return res.status(200).json({ message: 'Friend request declined.' });
  } catch (error) {
    console.error('Error declining friend request:', error);
    return res.status(500).json({ message: 'Error declining friend request', error: error.message });
  }
});

// DELETE /api/friends/remove
router.delete('/remove', async (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2) {
    return res.status(400).json({ message: 'Both user1 and user2 usernames are required.' });
  }

  try {
    const db = getDB();

    const [u1, u2] = await Promise.all([
      db.collection('users').findOne({ username: user1.toLowerCase().trim() }),
      db.collection('users').findOne({ username: user2.toLowerCase().trim() })
    ]);

    if (!u1 || !u2) {
      return res.status(404).json({ message: 'One or both users not found.' });
    }

    const result = await db.collection('friends').deleteOne({
      $or: [
        { userId1: u1._id, userId2: u2._id },
        { userId1: u2._id, userId2: u1._id }
      ]
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Friendship record not found.' });
    }

    return res.status(200).json({ message: 'Friend removed successfully.' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
});

export default router;