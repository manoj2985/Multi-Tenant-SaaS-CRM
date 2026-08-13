const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 7 — Production Engineering & Security Test Suite', () => {
  let userToken;
  let userId;
  let companyId;

  async function cleanDb() {
    await prisma.passwordResetToken.deleteMany({});
    await prisma.file.deleteMany({});
    await prisma.usage.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.notificationPreference.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.customerActivity.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.deal.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.company.deleteMany({});
  }

  beforeAll(async () => {
    await cleanDb();

    // Register test company & admin
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Secure Tech Inc',
        name: 'Sam Security',
        email: 'sam@securetech.com',
        password: 'Password123!'
      });

    userToken = res.body.accessToken;
    userId = res.body.user.id;
    companyId = res.body.company.id;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Security Headers & Request Tracing', () => {
    it('should include Helmet security headers in HTTP responses', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.headers['x-content-type-options']).toEqual('nosniff');
      expect(res.headers['x-frame-options']).toEqual('SAMEORIGIN');
    });

    it('should attach and propagate X-Request-ID header', async () => {
      const res = await request(app)
        .get('/health')
        .set('X-Request-ID', 'custom-trace-id-999');

      expect(res.statusCode).toEqual(200);
      expect(res.headers['x-request-id']).toEqual('custom-trace-id-999');
    });
  });

  describe('2. Health, Readiness & Metrics Probes', () => {
    it('GET /health should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
    });

    it('GET /ready should return database readiness status', async () => {
      const res = await request(app).get('/ready');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ready');
      expect(res.body.database).toEqual('ok');
    });

    it('GET /metrics should return request metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.statusCode).toEqual(200);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalRequests).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Password Policy & Reset Flow', () => {
    let resetTokenValue;

    it('should reject registration with weak password lacking special char/number', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Weak Password Corp',
          name: 'Weak User',
          email: 'weak@corp.com',
          password: 'simplepassword'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errorCode).toEqual('VALIDATION_ERROR');
    });

    it('should accept forgot-password request and return generic message', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'sam@securetech.com' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an account exists');

      // Fetch created token from DB for test assertion
      const tokenRecord = await prisma.passwordResetToken.findFirst({
        where: { userId }
      });
      expect(tokenRecord).toBeDefined();
    });

    it('should logout-all active refresh tokens', async () => {
      const res = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('All active sessions logged out');

      // Verify DB tokens revoked
      const activeTokensCount = await prisma.refreshToken.count({
        where: { userId, revoked: false }
      });
      expect(activeTokensCount).toEqual(0);
    });
  });
});
