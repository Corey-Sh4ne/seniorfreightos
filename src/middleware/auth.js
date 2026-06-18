import jwt from 'jsonwebtoken';

const VALID_ROLES = ['admin', 'dispatcher', 'install_crew_lead', 'client_user', 'client_end_customer'];

/**
 * Verifies the Bearer JWT in the Authorization header and attaches the
 * decoded user payload to req.user.  Call this before roleGuard.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.slice(7);

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (!VALID_ROLES.includes(decoded.role)) {
      return res.status(403).json({ error: 'Token contains an unrecognized role.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}
