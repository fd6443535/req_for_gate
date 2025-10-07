const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-azure-ad').OIDCStrategy;

const { OIDCStrategy } = require('passport-azure-ad');


passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  return done(null, {
    provider: 'google',
    accessToken,
    profile
  });
}));


const AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'common';
const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;
const AZURE_AD_REDIRECT_URL = process.env.AZURE_AD_REDIRECT_URL || `${process.env.BASE_URL}/auth/microsoft/callback`;

if (!AZURE_AD_CLIENT_ID || !AZURE_AD_CLIENT_SECRET) {
  console.warn('[WARN] Microsoft OAuth env vars not set. Set AZURE_AD_CLIENT_ID and AZURE_AD_CLIENT_SECRET');
}

passport.use('microsoft', new OIDCStrategy(
  {
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: process.env.AZURE_AD_CALLBACK_URL || `${process.env.BASE_URL}/api/auth/microsoft/callback`,
    allowHttpForRedirectUrl: true,
    validateIssuer: true, // allow multi-tenant (use caution in production)
    passReqToCallback: false,
    scope: ['openid', 'profile', 'email', 'offline_access', 'https://graph.microsoft.com/User.Read'],
    loggingLevel: 'warn',
  },
  (iss, sub, profile, accessToken, refreshToken, done) => {
  return done(null, {
    provider: 'microsoft',
    accessToken,
    profile
  });
}));




module.exports = passport;