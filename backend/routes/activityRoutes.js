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

  if (diffHours < 1) return `${Math.max(1, diffMins)}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

// GET /api/activities?feed=local&user=username
router.get('/', async (req, res) => {
  const { feed = 'global', user: username } = req.query;

  try {
    const db = getDB();
    let filter = {};
    
    if (feed === 'local') {
      if (!username) {
        return res.status(200).json([]);
      }

      const currentUser = await db.collection('users').findOne({
        username: username.toLowerCase().trim()
      });

      if (!currentUser) {
        return res.status(200).json([]);
      }
      
      const friendships = await db.collection('friends').find({
        $or: [
          { userId1: currentUser._id },
          { userId2: currentUser._id }
        ],
        status: 'accepted'
      }).toArray();
      
      const friendIds = friendships.map((f) =>
        f.userId1.toString() === currentUser._id.toString() ? f.userId2 : f.userId1
      );
      
      const allowedActorIds = [currentUser._id, ...friendIds];
      filter.actorId = { $in: allowedActorIds };
    }

    const activities = await db.collection('activities').aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } }, { $limit: 40 },      
      {
        $lookup: {
          from: 'users',
          localField: 'actorId',
          foreignField: '_id',
          as: 'actor'
        }
      },
      { $unwind: '$actor' },      
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'postDoc'
        }
      },
      { $unwind: { path: '$postDoc', preserveNullAndEmptyArrays: true } },      
      {
        $lookup: {
          from: 'albums',
          localField: 'albumId',
          foreignField: '_id',
          as: 'albumDoc'
        }
      },
      { $unwind: { path: '$albumDoc', preserveNullAndEmptyArrays: true } },      
      {
        $lookup: {
          from: 'users',
          localField: 'friendId',
          foreignField: '_id',
          as: 'friendDoc'
        }
      },
      { $unwind: { path: '$friendDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: '$_id',
          actionType: 1,
          createdAt: 1,
          actor: {
            id: '$actor._id',
            username: '$actor.username',
            name: '$actor.name',
            avatarUrl: '$actor.avatarUrl'
          },
          post: {
            id: '$postDoc._id',
            caption: '$postDoc.caption',
            imageUrl: '$postDoc.imageUrl'
          },
          album: {
            id: '$albumDoc._id',
            name: '$albumDoc.name'
          },
          targetFriend: {
            id: '$friendDoc._id',
            username: '$friendDoc.username',
            name: '$friendDoc.name'
          }
        }
      }
    ]).toArray();

    const formatted = activities.map((act) => ({
      ...act,
      timeAgo: formatTimeAgo(act.createdAt)
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ message: 'Error retrieving activities', error: error.message });
  }
});

export default router;