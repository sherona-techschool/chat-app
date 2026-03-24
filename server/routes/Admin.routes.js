// // routes/admin.routes.js

// const express         = require('express');
// const router          = express.Router();
// const adminController = require('../controllers/Admin.controller');

// // ── Simple admin guard ────────────────────────────────────────────────────
// // Checks for ADMIN_SECRET header so the dashboard is not publicly accessible.
// // Set ADMIN_SECRET=your-secret-here in your .env
// const adminGuard = (req, res, next) => {
//     const secret = req.headers['x-admin-secret'];
//     if (!secret || secret !== process.env.ADMIN_SECRET) {
//         return res.status(401).json({ message: 'Unauthorized' });
//     }
//     next();
// };

// // ── Admin routes ──────────────────────────────────────────────────────────
// router.get('/stats', adminGuard, adminController.getStats);
// router.get('/users', adminGuard, adminController.getUsers);
// router.get('/calls', adminGuard, adminController.getCalls);

// module.exports = router;