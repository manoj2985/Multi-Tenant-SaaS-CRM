const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 6 — Platform Administration Suite (SUPER_ADMIN)', () => {
  let superAdminToken;
  let companyAAdminToken;
  let companyAId;

  let companyBAdminToken;
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

    // Register Company A (First user becomes COMPANY_ADMIN)
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Platform Target Corp',
        name: 'Paul Partner',
        email: 'paul@targetcorp.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAId = resA.body.company.id;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Victim Corp',
        name: 'Vince Victim',
        email: 'vince@victimcorp.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBId = resB.body.company.id;

    // Promote Paul Partner to SUPER_ADMIN for testing platform management
    await prisma.user.update({
      where: { email: 'paul@targetcorp.com' },
      data: { role: 'SUPER_ADMIN' }
    });

    // Re-login to receive JWT with SUPER_ADMIN role claim
    const loginSuper = await request(app)
      .post('/api/auth/login')
      .send({ email: 'paul@targetcorp.com', password: 'Password123!' });
    superAdminToken = loginSuper.body.accessToken;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Platform Company Management', () => {
    it('SUPER_ADMIN should list all platform companies with usage metrics', async () => {
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toEqual(2);
    });

    it('SUPER_ADMIN should view detailed company overview', async () => {
      const res = await request(app)
        .get(`/api/admin/companies/${companyBId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.name).toEqual('Victim Corp');
      expect(res.body.data.usage).toBeDefined();
    });

    it('SUPER_ADMIN should override company subscription plan to ENTERPRISE', async () => {
      const res = await request(app)
        .patch(`/api/admin/companies/${companyBId}/plan`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ plan: 'ENTERPRISE' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.plan).toEqual('ENTERPRISE');
    });
  });

  describe('2. Company Suspension & Tenant Lockout', () => {
    it('SUPER_ADMIN should suspend Company B', async () => {
      const res = await request(app)
        .patch(`/api/admin/companies/${companyBId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('SUSPENDED');
    });

    it('CRITICAL: Suspended Company B users must be BLOCKED with 403 TENANT_SUSPENDED', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.errorCode).toEqual('TENANT_SUSPENDED');
    });

    it('SUPER_ADMIN should reactivate Company B', async () => {
      const res = await request(app)
        .patch(`/api/admin/companies/${companyBId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('ACTIVE');

      // Verify Company B can access API again
      const unblockRes = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(unblockRes.statusCode).toEqual(200);
    });
  });

  describe('3. Platform Audit Logs & Security Checks', () => {
    it('SUPER_ADMIN should fetch platform-level audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('CRITICAL SECURITY: Regular COMPANY_ADMIN should be REJECTED with 403 FORBIDDEN when accessing admin APIs', async () => {
      const res = await request(app)
        .get('/api/admin/companies')
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });
});
