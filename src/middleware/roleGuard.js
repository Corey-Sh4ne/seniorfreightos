/**
 * Returns middleware that restricts a route to users whose role is in
 * `allowedRoles`.  Must be composed after authenticate() so req.user exists.
 *
 * Client users are additionally scoped to their own organization — any request
 * that would expose another client's data is blocked here at the API layer.
 *
 * @param {string[]} allowedRoles - e.g. ['admin', 'dispatcher']
 * @param {object}   [options]
 * @param {boolean}  [options.enforceClientScope=false] - When true, verifies
 *   that req.query.clientName (or req.body.clientName) matches the token's
 *   clientName.  Set this on any route that filters by client.
 */
export function roleGuard(allowedRoles, { enforceClientScope = false } = {}) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthenticated — run authenticate() first.' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }

    if (enforceClientScope || user.role === 'client_user') {
      const requestedClient = req.query?.clientName || req.body?.clientName;

      if (!user.clientName) {
        return res.status(403).json({ error: 'Client users must have a clientName claim in their token.' });
      }

      if (requestedClient && requestedClient !== user.clientName) {
        return res.status(403).json({ error: 'Access denied — you may only view your own organization\'s data.' });
      }

      // Stamp the verified clientName onto the request so downstream handlers
      // can safely use it in DB queries without re-checking.
      req.clientName = user.clientName;
    }

    next();
  };
}
