const { v4: uuidv4 } = require('crypto');

function requestIdMiddleware(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const requestId = existingId || (uuidv4 ? uuidv4() : `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

module.exports = requestIdMiddleware;
