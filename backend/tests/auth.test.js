const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 2 — Security, Auth & Tenant Isolation Integration Suite', () => {
  let companyAAdminToken;
  let companyAUser;
  let companyAData;

  let companyBAdminToken;
  let companyBUser;
  let companyBData;

  let superAdminToken;
  let superAdminUser;

  async function cleanDb() {
    await prisma.apiRequestLog.deleteMany({});
    await prisma.apiKey.deleteMany({});
    await prisma.webhookDelivery.deleteMany({});
    await prisma.webhook.deleteMany({});
    await prisma.importJob.deleteMany({});
    await prisma.savedFilter.deleteMany({});
    await prisma.entityTag.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.customFieldDefinition.deleteMany({});
    await prisma.workflowExecution.deleteMany({});
    await prisma.workflowAction.deleteMany({});
    await prisma.workflowCondition.deleteMany({});
    await prisma.workflow.deleteMany({});
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
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Authentication & Registration', () => {
    it('should successfully register Company A and create initial COMPANY_ADMIN user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Alpha Tech Corp',
          name: 'Alpha Admin',
          email: 'admin@alphatech.com',
          password: 'Password123!',
          phone: '+1234567890'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toEqual('COMPANY_ADMIN');
      expect(res.body.company.name).toEqual('Alpha Tech Corp');

      companyAAdminToken = res.body.accessToken;
      companyAUser = res.body.user;
      companyAData = res.body.company;
    });

    it('should reject registration with a duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Alpha Tech Duplicate',
          name: 'Alpha Admin 2',
          email: 'admin@alphatech.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toEqual('DUPLICATE_EMAIL');
    });

    it('should authenticate user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@alphatech.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@alphatech.com',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toEqual('INVALID_CREDENTIALS');
    });

    it('should register Company B for tenant isolation testing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Beta Systems Inc',
          name: 'Beta Admin',
          email: 'admin@betasystems.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toEqual(201);
      companyBAdminToken = res.body.accessToken;
      companyBUser = res.body.user;
      companyBData = res.body.company;
    });
  });

  describe('2. User Profile & Token Auth', () => {
    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.email).toEqual('admin@alphatech.com');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should reject request without Bearer token', async () => {
      const res = await request(app)
        .get('/api/users/me');

      expect(res.statusCode).toEqual(401);
      expect(res.body.errorCode).toEqual('UNAUTHORIZED');
    });
  });

  describe('3. Strict Tenant Isolation Enforcement', () => {
    it('should allow User A to access Company A details', async () => {
      const res = await request(app)
        .get(`/api/companies/${companyAData.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.name).toEqual('Alpha Tech Corp');
    });

    it('CRITICAL: should BLOCK User A from accessing Company B details (Cross-Tenant Access)', async () => {
      const res = await request(app)
        .get(`/api/companies/${companyBData.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toEqual('TENANT_ACCESS_DENIED');
    });

    it('CRITICAL: should BLOCK User A from accessing User B details (Cross-Tenant User Inspection)', async () => {
      const res = await request(app)
        .get(`/api/users/${companyBUser.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toEqual('TENANT_ACCESS_DENIED');
    });
  });

  describe('4. Company Suspension Enforcement', () => {
    it('should allow SUPER_ADMIN to suspend Company B', async () => {
      const { hashPassword } = require('../src/utils/password');
      const { generateAccessToken } = require('../src/utils/token');
      const passHash = await hashPassword('SuperSecret123!');
      
      superAdminUser = await prisma.user.create({
        data: {
          companyId: companyAData.id,
          name: 'Global Super Admin',
          email: 'superadmin@platform.com',
          passwordHash: passHash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        }
      });

      superAdminToken = generateAccessToken({
        userId: superAdminUser.id,
        companyId: companyAData.id,
        role: 'SUPER_ADMIN'
      });

      const res = await request(app)
        .patch(`/api/companies/${companyBData.id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('SUSPENDED');
    });

    it('CRITICAL: should BLOCK users belonging to suspended Company B from protected APIs', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toEqual('TENANT_SUSPENDED');
    });
  });
});
