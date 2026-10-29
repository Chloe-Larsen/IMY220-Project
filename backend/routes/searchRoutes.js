import { Router } from 'express';
import { getDB } from '../connection.js';

const router = Router();

router.get('/', async (req, res) => {
    const { q, type = 'all' } = req.query;    
    if (!q || !q.trim()) {
        return res.status(200).json({ users: [], posts: [], albums: [] });
    }

    try {
        const db = getDB();
        const term = q.trim().replace(/^[#@]/, '');
        const regex = new RegExp(term, 'i');

        const results = { users: [], posts: [], albums: [] };

        if (type === 'all' || type === 'users') {
            results.users = await db.collection('users')
                .find({
                    $or: [
                        { username: regex },
                        { name: regex },
                        { surname: regex },
                        { email: regex }
                    ]
                })
                .project({ password: 0 })
                .limit(20)
                .toArray();
        }

        if (type === 'all' || type === 'posts') {
            results.posts = await db.collection('posts').aggregate([
                {
                    $match: {
                        $or: [
                            { caption: regex },
                            { hashtags: regex }
                        ]
                    }
                },
                { $limit: 20 },
                {
                    $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'author' }
                },
                { $unwind: '$author' },
                {
                    $project: {
                        id: '$_id',
                        caption: 1,
                        imageUrl: 1,
                        hashtags: 1,
                        username: '$author.username'
                    }
                }
            ]).toArray();
        }

        if (type === 'all' || type === 'albums') {
            results.albums = await db.collection('albums').aggregate([
                {
                    $match: {
                        $or: [
                            { name: regex },
                            { description: regex },
                            { hashtags: regex }
                        ]
                    }
                },
                { $limit: 20 },
                {
                    $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'owner' }
                },
                { $unwind: '$owner' },
                {
                    $lookup: { from: 'albumPosts', localField: '_id', foreignField: 'albumId', as: 'links' }
                },
                {
                    $project: {
                        id: '$_id',
                        name: 1,
                        description: 1,
                        username: '$owner.username',
                        photoCount: { $size: '$links' }
                    }
                }
            ]).toArray();
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: 'Error performing search' });
    }
});

export default router;