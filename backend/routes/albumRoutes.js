import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

function formatTimeAgo(date) {
  if (!date) return 'just now';

  const diffMs = Math.max(0, Date.now() - new Date(date).getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

  if (diffHours < 1) {
    return `${Math.max(1, diffMins)}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return `${diffWeeks} weeks`;
  }
}

async function resolveUserId(db, username) {
  if (!username) return null;
  const user = await db.collection('users').findOne({
    username: String(username).toLowerCase().trim()
  });
  return user ? user._id : null;
}

// GET /api/albums?user=username&viewer=username
router.get('/', async (req, res) => {
  const { user: username, viewer } = req.query;

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

    const viewerObjectId = await resolveUserId(db, viewer);

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
          from: 'likes',
          localField: 'albumPostLinks.postId',
          foreignField: 'postId',
          as: 'photoLikes'
        }
      },      
      {
        $lookup: {
          from: 'comments',
          localField: 'albumPostLinks.postId',
          foreignField: 'postId',
          as: 'photoComments'
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
                username: { $arrayElemAt: ['$owner.username', 0] },
                likes: {
                  $size: {
                    $filter: {
                      input: '$photoLikes',
                      as: 'like',
                      cond: { $eq: ['$$like.postId', '$$photo._id'] }
                    }
                  }
                },
                comments: {
                  $filter: {
                    input: '$photoComments',
                    as: 'comment',
                    cond: { $eq: ['$$comment.postId', '$$photo._id'] }
                  }
                },
                isLiked: viewerObjectId
                  ? {
                    $in: [
                      viewerObjectId,
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: '$photoLikes',
                              as: 'like',
                              cond: { $eq: ['$$like.postId', '$$photo._id'] }
                            }
                          },
                          as: 'like',
                          in: '$$like.userId'
                        }
                      }
                    ]
                  }
                  : { $literal: false }
              }
            }
          }
        }
      }
    ]).toArray();
    
    for (const album of albums) {
      if (Array.isArray(album.posts)) {
        for (const post of album.posts) {
          post.timeAgo = formatTimeAgo(post.createdAt);
        }
      }
    }

    return res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return res.status(500).json({ message: 'Error retrieving albums', error: error.message });
  }
});

// GET /api/albums/:id?viewer=username
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { viewer } = req.query;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Album ID.' });
  }

  try {
    const db = getDB();
    const albumId = new ObjectId(id);
    const viewerObjectId = await resolveUserId(db, viewer);

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
        $lookup: {
          from: 'likes',
          localField: 'links.postId',
          foreignField: 'postId',
          as: 'postLikes'
        }
      },      
      {
        $lookup: {
          from: 'comments',
          localField: 'links.postId',
          foreignField: 'postId',
          as: 'postComments'
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
                createdAt: '$$post.createdAt',
                username: '$owner.username',
                likes: {
                  $size: {
                    $filter: {
                      input: '$postLikes',
                      as: 'like',
                      cond: { $eq: ['$$like.postId', '$$post._id'] }
                    }
                  }
                },
                comments: {
                  $filter: {
                    input: '$postComments',
                    as: 'comment',
                    cond: { $eq: ['$$comment.postId', '$$post._id'] }
                  }
                },
                isLiked: viewerObjectId
                  ? {
                    $in: [
                      viewerObjectId,
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: '$postLikes',
                              as: 'like',
                              cond: { $eq: ['$$like.postId', '$$post._id'] }
                            }
                          },
                          as: 'like',
                          in: '$$like.userId'
                        }
                      }
                    ]
                  }
                  : { $literal: false }
              }
            }
          }
        }
      }
    ]).toArray();

    if (!albumList || albumList.length === 0) {
      return res.status(404).json({ message: 'Album not found.' });
    }

    const album = albumList[0];
    if (Array.isArray(album.posts)) {
      for (const post of album.posts) {
        post.timeAgo = formatTimeAgo(post.createdAt);
      }
    }

    return res.status(200).json(album);
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

    const remainingPosts = await db.collection('albumPosts').countDocuments({ albumId: new ObjectId(id) });

    if (remainingPosts === 0) {
      const album = await db.collection('albums').findOne({ _id: new ObjectId(id) });
      if (album) {
        await db.collection('albums').deleteOne({ _id: new ObjectId(id) });
      }
    }

    return res.status(200).json({ message: 'Post removed from album.' });
  } catch (error) {
    console.error('Error removing post from album:', error);
    return res.status(500).json({ message: 'Error removing post from album', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { requester } = req.body || {};

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Album ID.' });
  }

  try {
    const db = getDB();
    const albumObjectId = new ObjectId(id);

    const album = await db.collection('albums').findOne({ _id: albumObjectId });
    if (!album) return res.status(404).json({ message: 'Album not found.' });

    const user = await db.collection('users').findOne({ username: requester });
    const isAdmin = user && user.role === 'admin';
    const isOwner = album.userId.toString() === user?._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to delete this album.' });
    }

    await db.collection('albums').deleteOne({ _id: albumObjectId });
    await db.collection('albumPosts').deleteMany({ albumId: albumObjectId });
    await db.collection('activities').deleteMany({ albumId: albumObjectId });

    return res.status(200).json({ message: 'Album deleted successfully.' });
  } catch (error) {
    console.error('Error deleting album:', error);
    return res.status(500).json({ message: 'Error deleting album', error: error.message });
  }
});

// PUT /api/albums/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, hashtags, requester } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid Album ID.' });
  }

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ message: 'Album name cannot be empty.' });
  }

  try {
    const db = getDB();

    const album = await db.collection('albums').findOne({ _id: new ObjectId(id) });
    if (!album) return res.status(404).json({ message: 'Album not found.' });

    const user = await db.collection('users').findOne({ username: requester });
    const isAdmin = user && user.role === 'admin';
    const isOwner = album.userId.toString() === user?._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to edit this album.' });
    }

    const updateFields = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateFields.name = String(name).trim();
    if (description !== undefined) updateFields.description = String(description).trim();
    if (hashtags !== undefined) {
      if (Array.isArray(hashtags)) {
        updateFields.hashtags = hashtags;
      } else if (typeof hashtags === 'string') {
        updateFields.hashtags = hashtags.trim() ? hashtags.trim().split(/\s+/) : [];
      }
    }

    const result = await db.collection('albums').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Album not found.' });
    }

    return res.status(200).json({ message: 'Album updated successfully.' });
  } catch (error) {
    if (error.errInfo?.details?.schemaRulesNotSatisfied) {
      console.dir(error.errInfo.details.schemaRulesNotSatisfied, { depth: null });
    }
    return res.status(500).json({ message: 'Error updating album', error: error.message });
  }
});

export default router;