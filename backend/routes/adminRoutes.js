import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../connection.js';

const router = Router();

// GET /api/admin/report-reasons
router.get('/report-reasons', async (req, res) => {
    try {
        const db = getDB();
        const reasons = await db.collection('reportReasons').find({}).toArray();

        const formatted = reasons.map((r) => ({
            id: r._id.toString(),
            reason: r.reason
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching report reasons:', error);
        return res.status(500).json({ message: 'Error retrieving reasons', error: error.message });
    }
});

// POST /api/admin/report-reasons
router.post('/report-reasons', async (req, res) => {
    const { reason, username } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'Reason text is required.' });
    }

    try {
        const db = getDB();
        const cleanReason = reason.trim();
        let adminUser = null;
        if (username) {
            adminUser = await db.collection('users').findOne({
                username: username.toLowerCase().trim()
            });
        }

        if (!adminUser) {
            adminUser = await db.collection('users').findOne({ role: 'admin' });
        }

        if (!adminUser) {
            return res.status(500).json({ message: 'No admin user found to assign createdById.' });
        }

        const existing = await db.collection('reportReasons').findOne({
            reason: new RegExp(`^${cleanReason}$`, 'i')
        });

        if (existing) {
            return res.status(400).json({ message: 'This report reason already exists.' });
        }

        const docToInsert = {
            reason: cleanReason,
            createdById: adminUser._id,
            createdAt: new Date()
        };

        const result = await db.collection('reportReasons').insertOne(docToInsert);

        return res.status(201).json({
            message: 'Reason created',
            reason: {
                id: result.insertedId.toString(),
                reason: cleanReason
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error creating reason', error: error.message });
    }
});

// DELETE /api/admin/report-reasons/:id
router.delete('/report-reasons/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Reason ID.' });
    }

    try {
        const db = getDB();
        await db.collection('reportReasons').deleteOne({ _id: new ObjectId(id) });
        return res.status(200).json({ message: 'Report reason deleted successfully.' });
    } catch (error) {
        console.error('Error deleting report reason:', error);
        return res.status(500).json({ message: 'Error deleting reason', error: error.message });
    }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
    try {
        const db = getDB();

        const reports = await db.collection('reports').aggregate([
            { $sort: { reportedAt: -1 } },
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
                    from: 'users',
                    localField: 'postDoc.userId',
                    foreignField: '_id',
                    as: 'postAuthor'
                }
            },
            { $unwind: { path: '$postAuthor', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'reporterId',
                    foreignField: '_id',
                    as: 'reporterDoc'
                }
            },
            { $unwind: { path: '$reporterDoc', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'reportReasons',
                    localField: 'reasonId',
                    foreignField: '_id',
                    as: 'reasonDoc'
                }
            },
            { $unwind: { path: '$reasonDoc', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    id: '$_id',
                    postId: '$postId',
                    reporter: { $ifNull: ['$reporterDoc.username', 'anonymous'] },
                    reason: { $ifNull: ['$reasonDoc.reason', 'Unspecified'] },
                    postCaption: { $ifNull: ['$postDoc.caption', ''] },
                    postUsername: { $ifNull: ['$postAuthor.username', 'unknown'] },
                    reportedAt: 1
                }
            }
        ]).toArray();

        return res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return res.status(500).json({ message: 'Error retrieving reports', error: error.message });
    }
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Report ID.' });
    }

    try {
        const db = getDB();
        const reportId = new ObjectId(id);

        const report = await db.collection('reports').findOne({ _id: reportId });
        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        await db.collection('reports').deleteOne({ _id: reportId });
        const remainingCount = await db.collection('reports').countDocuments({ postId: report.postId });
        if (remainingCount <= 2) {
            await db.collection('posts').updateOne(
                { _id: report.postId },
                { $set: { isReportedHidden: false } }
            );
        }

        return res.status(200).json({ message: 'Report dismissed.' });
    } catch (error) {
        console.error('Error dismissing report:', error);
        return res.status(500).json({ message: 'Error dismissing report', error: error.message });
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const db = getDB();
        const users = await db.collection('users')
            .find({})
            .project({ password: 0 })
            .sort({ createdAt: -1 })
            .toArray();

        const formatted = users.map((u) => ({
            id: u._id.toString(),
            username: u.username,
            email: u.email,
            role: u.role || 'user'
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
});

// DELETE /api/admin/users/:id 
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid User ID.' });
    }

    try {
        const db = getDB();
        const userId = new ObjectId(id);

        const user = await db.collection('users').findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot suspend administrator accounts.' });
        }
        const userPosts = await db.collection('posts').find({ userId }).project({ _id: 1 }).toArray();
        const postIds = userPosts.map((p) => p._id);

        if (postIds.length > 0) {
            await db.collection('comments').deleteMany({ postId: { $in: postIds } });
            await db.collection('likes').deleteMany({ postId: { $in: postIds } });
            await db.collection('reports').deleteMany({ postId: { $in: postIds } });
            await db.collection('albumPosts').deleteMany({ postId: { $in: postIds } });
        }

        await db.collection('posts').deleteMany({ userId });
        await db.collection('albums').deleteMany({ userId });
        await db.collection('comments').deleteMany({ userId });
        await db.collection('likes').deleteMany({ userId });
        await db.collection('friends').deleteMany({ $or: [{ userId1: userId }, { userId2: userId }] });
        await db.collection('activities').deleteMany({ $or: [{ actorId: userId }, { postId: { $in: postIds } }] });
        await db.collection('reports').deleteMany({ reporterId: userId });

        await db.collection('users').deleteOne({ _id: userId });

        return res.status(200).json({ message: `User @${user.username} suspended and data cleared.` });
    } catch (error) {
        console.error('Error suspending user:', error);
        return res.status(500).json({ message: 'Error suspending user', error: error.message });
    }
});

// POST /api/posts/:id/report
router.post('/:id/report', async (req, res) => {
    const { id } = req.params;
    const { reporter, reason } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Post ID.' });
    }

    if (!reporter || !reason) {
        return res.status(400).json({ message: 'Reporter username and report reason are required.' });
    }

    try {
        const db = getDB();
        const postObjectId = new ObjectId(id);    
        const post = await db.collection('posts').findOne({ _id: postObjectId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }        
        const user = await db.collection('users').findOne({
            username: reporter.toLowerCase().trim()
        });
        if (!user) {
            return res.status(404).json({ message: 'Reporter user not found.' });
        }        
        let reasonDoc = await db.collection('reportReasons').findOne({
            reason: new RegExp(`^${reason.trim()}$`, 'i')
        });        
        if (!reasonDoc) {
            const insertReason = await db.collection('reportReasons').insertOne({
                reason: reason.trim(),
                createdById: user._id,
                createdAt: new Date()
            });
            reasonDoc = { _id: insertReason.insertedId };
        }
        
        const existingReport = await db.collection('reports').findOne({
            postId: postObjectId,
            reporterId: user._id
        });

        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this post.' });
        }        
        const reportDoc = {
            postId: postObjectId,
            reporterId: user._id,
            reasonId: reasonDoc._id,
            reportedAt: new Date()
        };

        await db.collection('reports').insertOne(reportDoc);                
        const reportCount = await db.collection('reports').countDocuments({ postId: postObjectId });
        if (reportCount >= 3) {
            await db.collection('posts').updateOne(
                { _id: postObjectId },
                { $set: { isReportedHidden: true } }
            );
        }

        return res.status(201).json({ message: 'Report submitted successfully.' });
    } catch (error) {
        console.error('Error reporting post:', error);
        if (error.errInfo?.details?.schemaRulesNotSatisfied) {
            console.dir(error.errInfo.details.schemaRulesNotSatisfied, { depth: null });
        }
        return res.status(500).json({ message: 'Error submitting report', error: error.message });
    }
});

export default router;