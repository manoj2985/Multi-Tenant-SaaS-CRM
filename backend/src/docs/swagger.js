const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multi-Tenant SaaS CRM API Documentation',
      version: '1.0.0',
      description: 'Production-ready REST API for Multi-Tenant SaaS CRM Platform (Phase 4 Productivity & Activity Management)'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {
      '/api/health': {
        get: { summary: 'Check API and Database Health Status' }
      },
      '/api/auth/register': {
        post: { summary: 'Register a new Company and initial COMPANY_ADMIN User' }
      },
      '/api/auth/login': {
        post: { summary: 'Authenticate User and return JWT Tokens' }
      },
      '/api/tasks': {
        get: { summary: 'List Tenant Tasks (Paginated, Searchable, Filterable)', security: [{ BearerAuth: [] }] },
        post: { summary: 'Create New Task', security: [{ BearerAuth: [] }] }
      },
      '/api/meetings': {
        get: { summary: 'List Scheduled Meetings', security: [{ BearerAuth: [] }] },
        post: { summary: 'Schedule Meeting (with Overlap Conflict Detection)', security: [{ BearerAuth: [] }] }
      },
      '/api/activities/customer/{customerId}': {
        get: { summary: 'Get Reverse-Chronological Customer Activity Timeline', security: [{ BearerAuth: [] }] }
      },
      '/api/audit-logs': {
        get: { summary: 'List Enterprise Security & Business Audit Logs', security: [{ BearerAuth: [] }] }
      }
    }
  },
  apis: []
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = setupSwagger;
