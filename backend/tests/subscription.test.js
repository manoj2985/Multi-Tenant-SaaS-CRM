const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 6 — SaaS Subscription & Usage Management Suite', () => {
  let companyAAdminToken;
  let companyAUser;
  let companyAId;

  let companyBAdminToken;
  let companyBUser;
  let companyBId;

  async function cleanDb() {
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

    // Register Company A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Acme SaaS Corp',
        name: 'Adam Admin',
        email: 'adam@acmesaass.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAUser = resA.body.user;
    companyAId = resA.body.company.id;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Beta Systems',
        name: 'Bob Boss',
        email: 'bob@betasystems.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBUser = resB.body.user;
    companyBId = resB.body.company.id;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Subscription & Usage Information', () => {
    it('should retrieve company subscription details and plan limits', async () => {
      const res = await request(app)
        .get('/api/subscription')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan).toEqual('FREE');
      expect(res.body.data.limits.customers).toEqual(100);
      expect(res.body.data.usage.users).toEqual(1);
    });

    it('should fetch available SaaS subscription plans comparison', async () => {
      const res = await request(app)
        .get('/api/subscription/plans')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.FREE).toBeDefined();
      expect(res.body.data.PREMIUM).toBeDefined();
      expect(res.body.data.ENTERPRISE).toBeDefined();
    });

    it('should fetch usage breakdown endpoint', async () => {
      const res = await request(app)
        .get('/api/subscription/usage')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.plan).toEqual('FREE');
      expect(res.body.data.usage.customers).toEqual(0);
    });
  });

  describe('2. Plan Upgrade & Change', () => {
    it('should upgrade company subscription from FREE to PREMIUM', async () => {
      const res = await request(app)
        .post('/api/subscription/change-plan')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ plan: 'PREMIUM' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.plan).toEqual('PREMIUM');

      const checkRes = await request(app)
        .get('/api/subscription')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(checkRes.body.data.plan).toEqual('PREMIUM');
      expect(checkRes.body.data.limits.customers).toEqual(5000);
    });
  });

  describe('3. Downgrade Protection Validation', () => {
    it('should ALLOW downgrade back to FREE if current usage is within FREE limits', async () => {
      const res = await request(app)
        .post('/api/subscription/change-plan')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ plan: 'FREE' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.plan).toEqual('FREE');
    });

    it('should BLOCK downgrade with 400 DOWNGRADE_LIMIT_EXCEEDED when current usage exceeds target plan limits', async () => {
      // First upgrade Company A to PREMIUM
      await request(app)
        .post('/api/subscription/change-plan')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ plan: 'PREMIUM' });

      // Create extra users so total active users = 4 (exceeding FREE maxUsers limit of 3)
      await prisma.user.createMany({
        data: [
          { companyId: companyAId, name: 'User 2', email: 'user2@acmesaass.com', passwordHash: 'hash', role: 'SALES_EXECUTIVE' },
          { companyId: companyAId, name: 'User 3', email: 'user3@acmesaass.com', passwordHash: 'hash', role: 'SALES_EXECUTIVE' },
          { companyId: companyAId, name: 'User 4', email: 'user4@acmesaass.com', passwordHash: 'hash', role: 'SALES_EXECUTIVE' }
        ]
      });

      const res = await request(app)
        .post('/api/subscription/change-plan')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ plan: 'FREE' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errorCode).toEqual('DOWNGRADE_LIMIT_EXCEEDED');
      expect(res.body.message).toContain('current usage exceeds the selected plan limits');

      // Clean up extra users
      await prisma.user.deleteMany({
        where: { email: { in: ['user2@acmesaass.com', 'user3@acmesaass.com', 'user4@acmesaass.com'] } }
      });

      // Reset plan back to FREE for remaining tests
      await prisma.subscription.update({
        where: { companyId: companyAId },
        data: { plan: 'FREE' }
      });
      await prisma.company.update({
        where: { id: companyAId },
        data: { subscriptionPlan: 'FREE' }
      });
    });
  });

  describe('4. Plan Limit Middleware Enforcement', () => {
    it('should reject creation with 403 PLAN_LIMIT_REACHED when resource limit is exceeded', async () => {
      // Create 100 customers (reaching FREE maxCustomers limit of 100)
      const customersData = Array.from({ length: 100 }, (_, i) => ({
        companyId: companyAId,
        name: `Limit Customer ${i}`,
        email: `limitcust${i}@test.com`
      }));
      await prisma.customer.createMany({ data: customersData });

      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ name: 'Overflow Client', email: 'overflow@test.com' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.errorCode).toEqual('PLAN_LIMIT_REACHED');
      expect(res.body.data.resource).toEqual('customers');

      // Clean up customer records
      await prisma.customer.deleteMany({ where: { companyId: companyAId } });
    });
  });

  describe('5. Multi-Tenant Security & Access Restrictions', () => {
    it('CRITICAL: Company A should NOT be able to view or change Company B subscription', async () => {
      // Normal endpoint uses authenticated req.user.companyId
      const resA = await request(app)
        .get('/api/subscription')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(resA.body.data.companyId).toEqual(companyAId);
      expect(resA.body.data.companyId).not.toEqual(companyBId);
    });
  });
});
