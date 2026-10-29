import { Router } from 'express';
import { getDB } from '../connection.js';

const router = Router();

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatch(text, term) {
    if (!text) return false;
    const cleanText = text.toLowerCase();
    const cleanTerm = term.toLowerCase();

    if (cleanText.includes(cleanTerm)) return true;

    const words = cleanText.split(/\s+/);
    for (const word of words) {
        const allowedTypos = cleanTerm.length < 5 ? 1 : 2;
        if (levenshteinDistance(word, cleanTerm) <= allowedTypos) {
            return true;
        }
    }
    return false;
}

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
            const allUsers = await db.collection('users')
                .find({})
                .project({ password: 0 })
                .limit(20)
                .toArray();

            results.users = allUsers.filter(u =>
                fuzzyMatch(u.username, term) ||
                fuzzyMatch(u.name, term) ||
                fuzzyMatch(u.surname, term) ||
                fuzzyMatch(u.email, term)
            ).slice(0, 20);
        }

        if (type === 'all' || type === 'posts') {
            const rawPosts = await db.collection('posts').aggregate([
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
            let finalPosts = rawPosts;
            if (rawPosts.length < 5) {
                const recentPosts = await db.collection('posts').aggregate([
                    { $sort: { createdAt: -1 } },
                    { $limit: 100 },
                    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'author' } },
                    { $unwind: '$author' },
                    { $project: { id: '$_id', caption: 1, imageUrl: 1, hashtags: 1, username: '$author.username' } }
                ]).toArray();

                const fuzzyPosts = recentPosts.filter(p => fuzzyMatch(p.caption, term));

                const combined = [...rawPosts, ...fuzzyPosts];
                finalPosts = Array.from(new Map(combined.map(item => [item.id.toString(), item])).values());
            }
            results.posts = finalPosts.slice(0, 20);
        }

        if (type === 'all' || type === 'albums') {
            const allAlbums = await db.collection('albums').aggregate([
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

            results.albums = allAlbums.filter(a =>
                fuzzyMatch(a.name, term) ||
                fuzzyMatch(a.description, term)
            ).slice(0, 20);
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ message: 'Error performing search' });
    }
});

export default router;