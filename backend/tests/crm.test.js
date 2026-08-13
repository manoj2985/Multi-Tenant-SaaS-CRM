const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 3 — CRM Core (Customers, Leads, Deals, Pipeline & Security Suite)', () => {
  let companyAAdminToken;
  let companyAUser;
  let companyAData;

  let companyBAdminToken;
  let companyBUser;
  let companyBData;

  let testCustomerA;
  let testCustomerB;
  let testLeadA;
  let testDealA;

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
        companyName: 'Acme Sales Corp',
        name: 'Alice Manager',
        email: 'alice@acmesales.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAUser = resA.body.user;
    companyAData = resA.body.company;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Zenith Logistics',
        name: 'Bob Admin',
        email: 'bob@zenith.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBUser = resB.body.user;
    companyBData = resB.body.company;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Customer Module Tests', () => {
    it('should create a customer for Company A', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          name: 'Global Enterprises',
          email: 'contact@globalent.com',
          phone: '+15550199',
          companyName: 'Global Ent LLC',
          industry: 'Technology',
          status: 'ACTIVE'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual('Global Enterprises');
      expect(res.body.data.companyId).toEqual(companyAData.id);

      testCustomerA = res.body.data;
    });

    it('should create a customer for Company B', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${companyBAdminToken}`)
        .send({
          name: 'Target Client B',
          email: 'target@clientb.com',
          status: 'ACTIVE'
        });

      expect(res.statusCode).toEqual(201);
      testCustomerB = res.body.data;
    });

    it('should list customers with pagination and search filter', async () => {
      const res = await request(app)
        .get('/api/customers?search=Global&page=0&limit=10')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.pagination.total).toEqual(1);
    });

    it('should soft delete a customer and exclude it from active list', async () => {
      // Create temp customer to soft delete
      const tempRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ name: 'Temp Customer' });

      const tempId = tempRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/customers/${tempId}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(deleteRes.statusCode).toEqual(200);

      // Verify soft deleted customer is no longer returned in list
      const listRes = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      const found = listRes.body.data.find(c => c.id === tempId);
      expect(found).toBeUndefined();
    });
  });

  describe('2. Lead Module & Conversion Tests', () => {
    it('should create a lead for Company A', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          name: 'Sarah Prospect',
          email: 'sarah@prospect.com',
          phone: '+15550288',
          source: 'WEBSITE',
          priority: 'HIGH'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.status).toEqual('NEW');
      testLeadA = res.body.data;
    });

    it('should update lead status to QUALIFIED', async () => {
      const res = await request(app)
        .patch(`/api/leads/${testLeadA.id}/status`)
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ status: 'QUALIFIED' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('QUALIFIED');
    });

    it('should convert lead to Customer and Deal atomically', async () => {
      const res = await request(app)
        .post(`/api/leads/${testLeadA.id}/convert`)
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          createCustomer: true,
          createDeal: true,
          dealTitle: 'Sarah Enterprise Contract',
          dealValue: 150000
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.deal).toBeDefined();
      expect(res.body.data.deal.value).toEqual(150000);

      // Verify lead is marked WON
      const leadRes = await request(app)
        .get(`/api/leads/${testLeadA.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);
      expect(leadRes.body.data.status).toEqual('WON');
    });

    it('should reject duplicate conversion of an already converted lead', async () => {
      const res = await request(app)
        .post(`/api/leads/${testLeadA.id}/convert`)
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ createCustomer: true });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errorCode).toEqual('ALREADY_CONVERTED');
    });
  });

  describe('3. Deal Module & Sales Pipeline Tests', () => {
    it('should create a deal for Company A customer', async () => {
      const res = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          customerId: testCustomerA.id,
          title: 'Q3 Software Expansion',
          value: 75000,
          stage: 'PROPOSAL',
          probability: 70
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.stage).toEqual('PROPOSAL');
      testDealA = res.body.data;
    });

    it('should update deal stage to NEGOTIATION', async () => {
      const res = await request(app)
        .patch(`/api/deals/${testDealA.id}/stage`)
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ stage: 'NEGOTIATION' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.stage).toEqual('NEGOTIATION');
    });

    it('should fetch sales pipeline grouped by stage', async () => {
      const res = await request(app)
        .get('/api/deals/pipeline')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.NEGOTIATION).toBeDefined();
      expect(res.body.data.NEGOTIATION.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Strict Multi-Tenant Security & Cross-Tenant Rejection Tests', () => {
    it('CRITICAL: should BLOCK User A from creating a Deal using Company B Customer (Cross-Tenant Customer Linkage)', async () => {
      const res = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          customerId: testCustomerB.id,
          title: 'Illegal Cross Tenant Deal',
          value: 50000
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.errorCode).toEqual('TENANT_ACCESS_DENIED');
    });

    it('CRITICAL: should BLOCK User A from viewing Company B customer', async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerB.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(404);
    });

    it('CRITICAL: should BLOCK User A from updating Company B customer', async () => {
      const res = await request(app)
        .put(`/api/customers/${testCustomerB.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.statusCode).toEqual(404);
    });
  });
});
