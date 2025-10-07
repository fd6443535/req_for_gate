const express = require('express');
const router = express.Router();
// const passport = require('../config/passport'); // Deprecated: redirect-based flow
const authController = require('../controllers/authHandler');

// --- Token-based Login (Frontend posts id_token) ---
router.post('/login/google', authController.loginWithGoogleToken);
router.post('/login/microsoft', authController.loginWithMicrosoftToken);

// --- Deprecated redirect-based OAuth routes (kept for reference) ---
// router.get('/login/google', passport.authenticate('google', {
//   scope: ['email', 'profile'],
//   session: false,
// }));
//
// router.get('/google/callback',
//   passport.authenticate('google', { failureRedirect: '/login', session: false }),
//   authController.oauthCallbackController
// );
//
// router.get(['/login/microsoft'], (req, res, next) => {
//   passport.authenticate('microsoft', {
//     prompt: 'select_account',
//   })(req, res, next);
// });
//
// router.get('/microsoft/callback',
//   passport.authenticate('microsoft', { failureRedirect: '/login', session: false }),
//   authController.oauthCallbackController
// );

module.exports = router;

// The following route was invalid here (app is undefined and jwt not imported). If needed, move to app.js or convert to router.get with proper middleware.
// app.get('/me', (req, res) => {
//   const token = req.cookies.accessToken;
//
//   if (!token) return res.status(401).json({ message: 'Unauthorized' });
//
//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);
//     res.json({ user });
//   } catch (err) {
//     return res.status(403).json({ message: 'Invalid token' });
//   }
// });
