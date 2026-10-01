import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

// GET /api/activity
router.get('/', async (req, res) => {
  const { scope = 'global', user: username } = req.query;

  try {
    const db = getDB();
    let filter = {};
    if (scope === 'local') {
      if (!username) {
        return res.status(200).json([]);
      }

      const currentUser = await db.collection('users').findOne({
        username: username.toLowerCase().trim()
      });

      if (!currentUser) {
        return res.status(200).json([]);
      }

      const currentUserId = currentUser._id;
      const currentUserIdStr = currentUserId.toString();
      
      const friendships = await db.collection('friends').find({
        status: 'accepted',
        $or: [
          { userId1: currentUserId },
          { userId2: currentUserId },
          { userId1: currentUserIdStr },
          { userId2: currentUserIdStr }
        ]
      }).toArray();
      
      const friendIds = friendships.map((f) => {
        const other = (f.userId1?.toString() === currentUserIdStr) ? f.userId2 : f.userId1;
        return ObjectId.isValid(other) ? new ObjectId(other) : other;
      });      
      filter = {
        actorId: { $in: [currentUserId, ...friendIds] }
      };
    }
    
    const activityFeed = await db.collection('activities').aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },      
      {
        $lookup: {
          from: 'users',
          localField: 'actorId',
          foreignField: '_id',
          as: 'actor'
        }
      },
      {
        $unwind: {
          path: '$actor',
          preserveNullAndEmptyArrays: true
        }
      },      
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'postDoc'
        }
      },      
      {
        $lookup: {
          from: 'albums',
          localField: 'albumId',
          foreignField: '_id',
          as: 'albumDoc'
        }
      },
      
      {
        $project: {
          id: '$_id',
          actionType: 1,
          createdAt: 1,
          photoCount: 1,
          username: { $ifNull: ['$actor.username', 'Unknown'] },
          actorName: { $ifNull: ['$actor.name', ''] },
          targetId: '$postId',
          albumId: '$albumId',
          albumName: { $arrayElemAt: ['$albumDoc.name', 0] },
          caption: { $arrayElemAt: ['$postDoc.caption', 0] },
          imageUrl: { $arrayElemAt: ['$postDoc.imageUrl', 0] },
          hashtags: { $ifNull: [{ $arrayElemAt: ['$postDoc.hashtags', 0] }, []] }
        }
      }
    ]).toArray();

    return res.status(200).json(activityFeed);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return res.status(500).json({ message: 'Error retrieving activities', error: error.message });
  }
});
export default router;