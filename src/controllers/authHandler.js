const authService = require('../services/auth.service');
const { getTenantCustomerId, getUserDefaults } = require('../services/tenant.service');

// New libs for token verification
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Instantiate reusable clients
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID;
const microsoftJwksUri = 'https://login.microsoftonline.com/common/discovery/v2.0/keys';
const msJwksClient = jwksClient({ jwksUri: microsoftJwksUri, timeout: 10000 });

async function oauthCallbackLogic(email, res, appType = 'web') {
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Missing user email.' });
    }

    // Step 1: Get user details from DB
    const userInfo = await getUserDefaults(email);
    const { tenant_id, employee_id, language, company_id } = userInfo;

    // Step 2: Verify user, tenant, customer status
    const customerId = await getTenantCustomerId(tenant_id);
    const userEnabled = await authService.isUserEnabled(email);
    const tenantEnabled = await authService.isTenantEnabled(customerId, tenant_id);
    const customerEnabled = await authService.isCustomerEnabled(customerId);

    if (!userEnabled || !tenantEnabled || !customerEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Account is not enabled or invalid access.'
      });
    }

    // Step 3: Set cookies
    res.cookie('empId', employee_id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });

    res.cookie(
      'context',
      'j:' + JSON.stringify({
        empId: employee_id,
        companyId: company_id,
        language: language || 'en',
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      }
    );

    // Step 4: set x-tenant-id header
    res.set('x-tenant-id', tenant_id);

    return res.status(200).json({
      success: true,
      message: 'Mobile login successful',
      appType,
    });
  } catch (err) {
    console.error('oauthCallbackLogic error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Mobile login failed' });
  }
}

const oauthCallbackController = async (req, res) => {
  try {
    // Extract email robustly from Google or Azure AD passport profile
    const profile = req.user?.profile || req.user;
    const email =
      (profile?.emails && profile.emails[0]?.value) ||
      profile?._json?.email ||
      profile?._json?.preferred_username ||
      profile?.upn ||
      null;
    const appType = req.query.state || 'web';

    if (!email) {
      return res.status(400).send('Missing user email from OAuth profile.');
    }

    return oauthCallbackLogic(email, res, appType);
  } catch (err) {
    console.error('OAuth Callback Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Mobile login failed',
    });
  }
};

async function verifyMicrosoftToken(idToken) {
  // If MICROSOFT_PUBLIC_KEY is provided, use it directly
  const envPublicKey = process.env.MICROSOFT_PUBLIC_KEY;
  try {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.header) {
      throw new Error('Invalid token format');
    }

    const tokenKid = decoded.header.kid;
    const tokenAlg = decoded.header.alg;
    if (tokenAlg !== 'RS256') {
      throw new Error('Unexpected token algorithm');
    }

    const payload = decoded.payload || {};
    const expectedIssuer = payload.iss; // dynamic issuer from token

    let publicKey;
    if (envPublicKey) {
      publicKey = envPublicKey;
    } else {
      // Fetch signing key from JWKS
      publicKey = await new Promise((resolve, reject) => {
        msJwksClient.getSigningKey(tokenKid, (err, key) => {
          if (err) return reject(err);
          try {
            const pk = key.getPublicKey ? key.getPublicKey() : key.publicKey;
            resolve(pk);
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    const verified = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      audience: microsoftClientId,
      issuer: expectedIssuer,
    });

    return verified;
  } catch (err) {
    throw err;
  }
}

exports.loginWithGoogleToken = async (req, res) => {
  try {
    const { token, appType = 'web' } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }

    if (!googleClientId) {
      console.error('GOOGLE_CLIENT_ID not set');
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload?.email || null;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not found in Google token' });
    }

    return oauthCallbackLogic(email, res, appType);
  } catch (err) {
    console.error('loginWithGoogleToken error:', err?.message || err);
    return res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
};

exports.loginWithMicrosoftToken = async (req, res) => {
  try {
    const { token, appType = 'web' } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }

    if (!microsoftClientId) {
      console.error('MICROSOFT_CLIENT_ID/AZURE_AD_CLIENT_ID not set');
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    const verified = await verifyMicrosoftToken(token);
    const email = verified?.email || verified?.preferred_username || verified?.upn || null;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not found in Microsoft token' });
    }

    return oauthCallbackLogic(email, res, appType);
  } catch (err) {
    console.error('loginWithMicrosoftToken error:', err?.message || err);
    return res.status(401).json({ success: false, message: 'Invalid Microsoft token' });
  }
};

module.exports = {
  oauthCallbackController,
  loginWithGoogleToken: exports.loginWithGoogleToken,
  loginWithMicrosoftToken: exports.loginWithMicrosoftToken,
  oauthCallbackLogic,
};
