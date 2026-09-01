import { Router } from 'express';

const router = Router();

const posts = [
    {
        id: '1',
        username: 'avian_chloe',
        hashtags: '#Sugarbird #Protea #CapeTown',
        caption: 'Cape Sugarbird feeding on king protea blossoms early morning.',
        likes: 42,
        timeAgo: '2h',
        comments: [{ id: 1, text: 'Beautiful composition!' }, 
            { id: 2, text: 'Love it!' },
            { id: 2, text: 'Clock it!' }
        ]
    },
    {
        id: '2',
        username: 'raptor_hunter',
        hashtags: '#FishEagle #Wildlife #Kruger',
        caption: 'African Fish Eagle perched along the Olifants River.',
        likes: 88,
        timeAgo: '4h',
        comments: [{ id: 1, text: 'Incredible sharpness!' }, 
            { id: 2, text: 'I have always wanted to see one!' }
        ]
    },
    {
        id: '3',
        username: 'sunbird_snaps',
        hashtags: '#MalachiteSunbird #Fynbos',
        caption: 'Iridescent emerald feathers catching the midday sunlight.',
        likes: 19,
        timeAgo: '6h',
        comments: []
    },
    {
        id: '4',
        username: 'owl_scout',
        hashtags: '#BarnOwl #Nocturnal',
        caption: 'Silent flight captured at dusk along the coastal reserve.',
        likes: 65,
        timeAgo: '1d',
        comments: [{ id: 1, text: 'Great night shot.' }]
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