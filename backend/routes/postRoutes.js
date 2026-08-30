import { Router } from 'express';

const router = Router();

const posts = [
    {
        id: '1',
        username: 'birdwatcher_99',
        caption: 'A rare Cape Sugarbird spotted on the protea blooms this morning.',
        likes: 24,
        timeAgo: '2h',
        comments: [
            { id: 1, user: 'avian_fan', text: 'Stunning feather details!' },
            { id: 2, user: 'nature_lens', text: 'Great focus on the beak.' }
        ]
    },
    {
        id: '2',
        username: 'raptor_chaser',
        caption: 'African Fish Eagle hunting over the lake during golden hour.',
        likes: 85,
        timeAgo: '5h',
        comments: [
            { id: 1, user: 'safari_guy', text: 'Iconic shot!' }
        ]
    }
];

// GET /api/posts
router.get('/', (req, res) => {
    res.status(200).json(posts);
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
    const post = posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
    }
    res.status(200).json(post);
});

// POST /api/posts/:id/comments
router.post('/:id/comments', (req, res) => {
    const { text, user } = req.body;
    const post = posts.find((p) => p.id === req.params.id);

    if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
    }

    const newComment = { id: Date.now(), user: user || 'guest_user', text };
    post.comments.push(newComment);

    res.status(201).json({ message: 'Comment added.', comment: newComment });
});

export default router;