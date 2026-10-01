import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

// GET /api/albums?user=username
router.get('/', async (req, res) => {
  const { user: username } = req.query;

  try {
    const db = getDB();
    let filter = {};

    if (username) {
      const user = await db.collection('users').findOne({
        username: username.toLowerCase().trim()
      });

      if (!user) {
        return res.status(200).json([]);
      }

      filter.userId = user._id;
    }

    const albums = await db.collection('albums').aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },      
      {
        $lookup: {
          from: 'albumPosts',
          let: { aId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$albumId', '$$aId'] } } },
            { $sort: { addedAt: -1 } }
          ],
          as: 'albumPostLinks'
        }
      },      
      {
        $lookup: {
          from: 'posts',
          localField: 'albumPostLinks.postId',
          foreignField: '_id',
          as: 'photos'
        }
      },      
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner'
        }
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $arrayElemAt: ['$owner.username', 0] },
          photoCount: { $size: '$albumPostLinks' },
          coverImage: { $ifNull: [{ $arrayElemAt: ['$photos.imageUrl', 0] }, null] },          
          posts: {
            $map: {
              input: '$photos',
              as: 'photo',
              in: {
                id: '$$photo._id',
                imageUrl: '$$photo.imageUrl',
                caption: '$$photo.caption',
                hashtags: '$$photo.hashtags',
                createdAt: '$$photo.createdAt',
                username: '$owner.username'
              }
            }
          }
        }
      }
    ]).toArray();

    return res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return res.status(500).json({ message: 'Error retrieving albums', error: error.message });
  }
});

// GET /api/albums/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Album ID.' });
  }

  try {
    const db = getDB();
    const albumId = new ObjectId(id);

    const albumList = await db.collection('albums').aggregate([
      { $match: { _id: albumId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'owner'
        }
      },
      { $unwind: '$owner' },
      {
        $lookup: {
          from: 'albumPosts',
          localField: '_id',
          foreignField: 'albumId',
          as: 'links'
        }
      },
      {
        $lookup: {
          from: 'posts',
          localField: 'links.postId',
          foreignField: '_id',
          as: 'posts'
        }
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          username: '$owner.username',
          photoCount: { $size: '$links' },
          posts: {
            $map: {
              input: '$posts',
              as: 'post',
              in: {
                id: '$$post._id',
                imageUrl: '$$post.imageUrl',
                caption: '$$post.caption',
                hashtags: '$$post.hashtags',
                createdAt: '$$post.createdAt'
              }
            }
          }
        }
      }
    ]).toArray();

    if (!albumList || albumList.length === 0) {
      return res.status(404).json({ message: 'Album not found.' });
    }

    return res.status(200).json(albumList[0]);
  } catch (error) {
    console.error('Error loading album:', error);
    return res.status(500).json({ message: 'Error loading album', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { username, name, description } = req.body;

  if (!username || !name) {
    return res.status(400).json({ message: 'Username and album name are required.' });
  }

  try {
    const db = getDB();
    const user = await db.collection('users').findOne({
      username: username.toLowerCase().trim()
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const now = new Date();
    const newAlbum = {
      userId: user._id,
      name: String(name).trim(),
      description: String(description || '').trim(),
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('albums').insertOne(newAlbum);
    
    await db.collection('activities').insertOne({
      actorId: user._id,
      actionType: 'created_album',
      postId: null,
      albumId: result.insertedId,
      photoCount: 0,
      createdAt: now
    });

    return res.status(201).json({
      message: 'Album created successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating album:', error);
    return res.status(500).json({ message: 'Error creating album', error: error.message });
  }
});

router.post('/:id/posts', async (req, res) => {
  const { id } = req.params;
  const { postId } = req.body;

  if (!ObjectId.isValid(id) || !ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid Album ID or Post ID.' });
  }

  try {
    const db = getDB();
    const albumObjectId = new ObjectId(id);
    const postObjectId = new ObjectId(postId);

    const album = await db.collection('albums').findOne({ _id: albumObjectId });
    if (!album) return res.status(404).json({ message: 'Album not found.' });

    const post = await db.collection('posts').findOne({ _id: postObjectId });
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    
    const exists = await db.collection('albumPosts').findOne({
      albumId: albumObjectId,
      postId: postObjectId
    });

    if (exists) {
      return res.status(400).json({ message: 'Post is already in this album.' });
    }

    await db.collection('albumPosts').insertOne({
      albumId: albumObjectId,
      postId: postObjectId,
      addedAt: new Date()
    });
    
    await db.collection('albums').updateOne(
      { _id: albumObjectId },
      { $set: { updatedAt: new Date() } }
    );

    return res.status(200).json({ message: 'Post added to album.' });
  } catch (error) {
    console.error('Error adding post to album:', error);
    return res.status(500).json({ message: 'Error adding post to album', error: error.message });
  }
});

router.delete('/:id/posts/:postId', async (req, res) => {
  const { id, postId } = req.params;

  if (!ObjectId.isValid(id) || !ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid Album ID or Post ID.' });
  }

  try {
    const db = getDB();
    const result = await db.collection('albumPosts').deleteOne({
      albumId: new ObjectId(id),
      postId: new ObjectId(postId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Post not found in this album.' });
    }

    return res.status(200).json({ message: 'Post removed from album.' });
  } catch (error) {
    console.error('Error removing post from album:', error);
    return res.status(500).json({ message: 'Error removing post from album', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Album ID.' });
  }

  try {
    const db = getDB();
    const albumObjectId = new ObjectId(id);
    
    await db.collection('albums').deleteOne({ _id: albumObjectId });
    await db.collection('albumPosts').deleteMany({ albumId: albumObjectId });
    await db.collection('activities').deleteMany({ albumId: albumObjectId });

    return res.status(200).json({ message: 'Album deleted successfully.' });
  } catch (error) {
    console.error('Error deleting album:', error);
    return res.status(500).json({ message: 'Error deleting album', error: error.message });
  }
});

export default router;