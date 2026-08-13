const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const requestIdMiddleware = require('./middleware/requestId.middleware');
const { authenticateApiKey } = require('./middleware/apiKey.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { getHealth, getReady, getMetrics, incrementMetrics } = require('./controllers/health.controller');
const loggerMiddleware = require('./middleware/logger.middleware');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes');
const setupSwagger = require('./config/swagger');

const app = express();

// 1. Security Headers Middleware (Helmet)
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production',
  crossOriginEmbedderPolicy: false
}));

// 2. Strict CORS Configuration
app.use(cors({
  origin: config.corsOrigin || config.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Refresh-Token', 'X-Request-ID', 'X-API-Key']
}));

// 3. Request ID Propagation
app.use(requestIdMiddleware);

// 4. Developer API Key Authentication
app.use(authenticateApiKey);

// 5. Request Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Root Level Liveness, Readiness & Metrics Probes
app.get('/health', getHealth);
app.get('/ready', getReady);
app.get('/metrics', getMetrics);

// 7. Global API Rate Limiter
app.use('/api', apiLimiter);

// 8. Metrics & Logging Middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    incrementMetrics(res.statusCode);
  });
  next();
});
app.use(loggerMiddleware);

// 9. OpenAPI / Swagger Documentation UI
setupSwagger(app);

// 10. API Routes (Supporting both /api and /api/v1 versioning)
app.use('/api/v1', routes);
app.use('/api', routes);

// 11. 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
