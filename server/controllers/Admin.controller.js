// // controllers/admin.controller.js

// const User    = require('../models/User');
// const Message = require('../models/Message');

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/admin/stats
// // Returns: totalUsers, activeUsers, totalCalls, newUsersToday,
// //          newUsersThisWeek, callBreakdown, registrationTrend (last 7 days)
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getStats = async (req, res) => {
//     try {
//         const now       = new Date();
//         const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
//         const weekStart  = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0,0,0,0);

//         // ── User counts ───────────────────────────────────────────────────
//         const totalUsers      = await User.countDocuments();
//         const newUsersToday   = await User.countDocuments({ createdAt: { $gte: todayStart } });
//         const newUsersWeek    = await User.countDocuments({ createdAt: { $gte: weekStart  } });

//         // ── Active users (online status) ──────────────────────────────────
//         const activeUsers = await User.countDocuments({ status: 'online' });

//         // ── Call stats from Message collection ────────────────────────────
//         const totalVideoCalls = await Message.countDocuments({ type: 'video_call' });
//         const totalAudioCalls = await Message.countDocuments({ type: 'audio_call' });
//         const totalCalls      = totalVideoCalls + totalAudioCalls;

//         // ── New registrations per day for last 7 days (chart data) ────────
//         const registrationTrend = [];
//         for (let i = 6; i >= 0; i--) {
//             const dayStart = new Date(now);
//             dayStart.setDate(now.getDate() - i);
//             dayStart.setHours(0, 0, 0, 0);
//             const dayEnd = new Date(dayStart);
//             dayEnd.setHours(23, 59, 59, 999);

//             const count = await User.countDocuments({
//                 createdAt: { $gte: dayStart, $lte: dayEnd },
//             });

//             registrationTrend.push({
//                 date:  dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//                 count,
//             });
//         }

//         // ── Calls per day for last 7 days ─────────────────────────────────
//         const callsTrend = [];
//         for (let i = 6; i >= 0; i--) {
//             const dayStart = new Date(now);
//             dayStart.setDate(now.getDate() - i);
//             dayStart.setHours(0, 0, 0, 0);
//             const dayEnd = new Date(dayStart);
//             dayEnd.setHours(23, 59, 59, 999);

//             const count = await Message.countDocuments({
//                 type:      { $in: ['video_call', 'audio_call'] },
//                 createdAt: { $gte: dayStart, $lte: dayEnd },
//             });

//             callsTrend.push({
//                 date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//                 count,
//             });
//         }

//         res.status(200).json({
//             totalUsers,
//             activeUsers,
//             totalCalls,
//             totalVideoCalls,
//             totalAudioCalls,
//             newUsersToday,
//             newUsersWeek,
//             registrationTrend,
//             callsTrend,
//         });

//     } catch (err) {
//         console.error('[Admin] getStats error:', err);
//         res.status(500).json({ message: 'Failed to fetch stats' });
//     }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/admin/users
// // Returns paginated user list with online status
// // Query: page=1&limit=10&search=name
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getUsers = async (req, res) => {
//     try {
//         const page   = parseInt(req.query.page)   || 1;
//         const limit  = parseInt(req.query.limit)  || 10;
//         const search = req.query.search || '';
//         const skip   = (page - 1) * limit;

//         const query = search
//             ? { $or: [
//                 { fullName: { $regex: search, $options: 'i' } },
//                 { email:    { $regex: search, $options: 'i' } },
//                 { username: { $regex: search, $options: 'i' } },
//               ]}
//             : {};

//         const [users, total] = await Promise.all([
//             User.find(query)
//                 .select('-password')
//                 .sort({ createdAt: -1 })
//                 .skip(skip)
//                 .limit(limit),
//             User.countDocuments(query),
//         ]);

//         res.status(200).json({
//             users,
//             total,
//             page,
//             totalPages: Math.ceil(total / limit),
//         });

//     } catch (err) {
//         console.error('[Admin] getUsers error:', err);
//         res.status(500).json({ message: 'Failed to fetch users' });
//     }
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/admin/calls
// // Returns recent call log with sender/receiver names
// // ─────────────────────────────────────────────────────────────────────────────
// exports.getCalls = async (req, res) => {
//     try {
//         const limit = parseInt(req.query.limit) || 20;

//         const calls = await Message.find({
//             type: { $in: ['video_call', 'audio_call'] },
//         })
//             .sort({ createdAt: -1 })
//             .limit(limit)
//             .populate('sender',   'fullName email')
//             .populate('receiver', 'fullName email');

//         res.status(200).json(calls);

//     } catch (err) {
//         console.error('[Admin] getCalls error:', err);
//         res.status(500).json({ message: 'Failed to fetch calls' });
//     }
// };