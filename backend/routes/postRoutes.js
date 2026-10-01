import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

// GET /api/posts
router.get('/', async (req, res) => {
  const { q, feed = 'global', user: username } = req.query;

  try {
    const db = getDB();
    let filter = { isReportedHidden: { $ne: true } };

    if (feed === 'local' && username) {
      const currentUser = await db.collection('users').findOne({
        username: username.toLowerCase().trim()
      });

      if (currentUser) {        
        const friendships = await db.collection('friends').find({
          $or: [{ userId1: currentUser._id }, { userId2: currentUser._id }],
          status: 'accepted'
        }).toArray();
        
        const friendIds = friendships.map((f) =>
          f.userId1.toString() === currentUser._id.toString() ? f.userId2 : f.userId1
        );        
        const allowedAuthorIds = [currentUser._id, ...friendIds];
        filter.userId = { $in: allowedAuthorIds };
      } else {
        return res.status(200).json([]);
      }
    }


    if (q && q.trim()) {
      const term = q.trim().replace(/^[#@]/, '');
      const regex = new RegExp(term, 'i');

      const matchingUsers = await db.collection('users')
        .find({ $or: [{ username: regex }, { name: regex }] })
        .project({ _id: 1 })
        .toArray();
      const userIds = matchingUsers.map((u) => u._id);

      filter = {
        ...filter,
        $or: [
          { caption: regex },
          { hashtags: regex },
          { userId: { $in: userIds } }
        ]
      };
    }

    let currentUserId = null;
    if (username) {
      const currentUser = await db.collection('users').findOne({
        username: username.toLowerCase().trim()
      });
      if (currentUser) currentUserId = currentUser._id;
    }

    const posts = await db.collection('posts').aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes'
        }
      },
      {
        $project: {
          id: '$_id',
          caption: 1,
          imageUrl: 1,
          hashtags: 1,
          createdAt: 1,
          username: '$author.username',
          likes: { $size: '$likes' },
          comments: '$comments',
          isLiked: currentUserId
            ? { $in: [currentUserId, '$likes.userId'] }
            : { $literal: false }
        }
      }
    ]).toArray();

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving posts', error: error.message });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const postId = new ObjectId(req.params.id);

    const postList = await db.collection('posts').aggregate([
      { $match: { _id: postId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $lookup: {
          from: 'comments',
          let: { pid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$postId', '$$pid'] } } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'commentAuthor'
              }
            },
            { $unwind: '$commentAuthor' },
            {
              $project: {
                id: '$_id',
                text: 1,
                user: '$commentAuthor.username',
                createdAt: 1
              }
            }
          ],
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'postId',
          as: 'likes'
        }
      },
      {
        $project: {
          id: '$_id',
          caption: 1,
          imageUrl: 1,
          hashtags: 1,
          createdAt: 1,
          username: '$author.username',
          likes: { $size: '$likes' },
          comments: '$comments'
        }
      }
    ]).toArray();

    if (!postList || postList.length === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    res.status(200).json(postList[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error loading post', error: error.message });
  }
});

// POST /api/posts
router.post('/', async (req, res) => {
  const { username, caption, hashtags, imageUrl } = req.body;

  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ username: username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newPost = {
      userId: new ObjectId(user._id),
      imageUrl,
      caption,
      hashtags: Array.isArray(hashtags) ? hashtags : (hashtags || '').split(/\s+/),
      isReportedHidden: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('posts').insertOne(newPost);
    await db.collection('activities').insertOne({
      actorId: new ObjectId(user._id),
      actionType: 'created_post',
      postId: result.insertedId,
      albumId: null,
      photoCount: null,
      createdAt: new Date()
    });
    res.status(201).json({ message: 'Post published', id: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message })
  }
});

// PUT /api/posts/:id
router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { caption, hashtags } = req.body;

    await db.collection('posts').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          caption,
          hashtags: Array.isArray(hashtags) ? hashtags : (hashtags || '').split(/\s+/),
          updatedAt: new Date()
        }
      }
    );

    res.status(200).json({ message: 'Post updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating post', error: error.message });
  }
})

//DELETE api/post/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const postId = new ObjectId(req.params.id);

    await db.collection('posts').deleteOne({ _id: postId });
    await db.collection('comments').deleteMany({ postId });
    await db.collection('likes').deleteMany({ postId });
    await db.collection('albumPosts').deleteMany({ postId });
    await db.collection('activities').deleteMany({ postId });

    res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

//POST /api/posts/:id/like
router.post('/:id/like', async (req, res) => {
  const { username } = req.body;
  const rawPostId = req.params.id;
  if (!username) {
    return res.status(400).json({ message: 'Username is required to like a post.' });
  }
  if (!ObjectId.isValid(rawPostId)) {
    return res.status(400).json({ message: 'Invalid Post ID.' });
  }
  try {
    const db = getDB();
    const postId = new ObjectId(req.params.id);
    const user = await db.collection('users').findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const existingLike = await db.collection('likes').findOne({
      postId,
      userId: user._id
    });

    if (existingLike) {
      await db.collection('likes').deleteOne({ _id: existingLike._id });
      const count = await db.collection('likes').countDocuments({ postId });
      return res.status(200).json({ liked: false, likesCount: count });
    } else {
      await db.collection('likes').insertOne({
        postId,
        userId: user._id,
        createdAt: new Date()
      });
      const count = await db.collection('likes').countDocuments({ postId });
      return res.status(200).json({ liked: true, likesCount: count });
    }
  } catch (error) {
    console.dir(error, { depth: null });
    res.status(500).json({ message: 'Error updating like on the post', error: error.message });
  }
});

//POST /api/posts/:id/comments
router.post('/:id/comments', async (req, res) => {
  const { text, user: username } = req.body;
  try {
    const db = getDB();
    const postId = new ObjectId(req.params.id);
    const user = await db.collection('users').findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newComment = {
      postId,
      userId: user._id,
      text,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('comments').insertOne(newComment);

    res.status(201).json({
      message: 'Comment added',
      comment: {
        id: result.insertedId,
        text,
        user: user.username,
        createdAt: newComment.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// POST /api/posts/:id/report
router.post('/:id/report', async (req, res) => {
  const { reporter, reason } = req.body;

  try {
    const db = getDB();
    const postId = new ObjectId(req.params.id);
    const user = await db.collection('users').findOne({ username: reporter });
    const reasonDoc = await db.collection('reportReasons').findOne({ reason });

    if (!user || !reasonDoc) {
      return res.status(400).json({ message: 'Invalid reporter or report reason.' });
    }

    await db.collection('reports').insertOne({
      postId,
      reporterId: user._id,
      reasonId: reasonDoc._id,
      reportedAt: new Date()
    });

    const reportCount = await db.collection('reports').countDocuments({ postId });
    if (reportCount >= 2) {
      await db.collection('posts').updateOne(
        { _id: postId },
        { $set: { isReportedHidden: true } }
      );
    }

    res.status(200).json({ message: 'Report received' });
  } catch (error) {
    res.status(500).json({ message: 'Error filing report', error: error.message });
  }
});

export default router;