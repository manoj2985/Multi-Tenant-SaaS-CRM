const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 5 — Executive Dashboard & Analytics Integration Suite', () => {
  let companyAAdminToken;
  let companyAUser;
  let companyAData;

  let companyBAdminToken;
  let companyBData;

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
        companyName: 'Apex Financial Services',
        name: 'Arthur Admin',
        email: 'arthur@apexfin.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAUser = resA.body.user;
    companyAData = resA.body.company;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Beacon Tech Group',
        name: 'Brian Boss',
        email: 'brian@beacontech.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBData = resB.body.company;

    // Seed Company A records
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'Enterprise Client A', email: 'clienta@enterprise.com' });

    const customerAId = custRes.body.data.id;

    // Seed Leads for Company A
    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'Lead One', source: 'WEBSITE', status: 'NEW', priority: 'HIGH' });

    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'Lead Two', source: 'REFERRAL', status: 'QUALIFIED', priority: 'MEDIUM' });

    // Seed Deals for Company A
    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ customerId: customerAId, title: 'CRM Expansion Contract', value: 100000, stage: 'WON' });

    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ customerId: customerAId, title: 'Cloud Infrastructure Deal', value: 50000, stage: 'PROPOSAL' });

    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ customerId: customerAId, title: 'Legacy Migration Deal', value: 30000, stage: 'LOST' });

    // Seed Tasks for Company A
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ title: 'Send Q4 Invoice', priority: 'URGENT', status: 'TODO', dueDate: '2026-12-31' });

    // Seed Company B Deal for Multi-Tenant Isolation Verification
    const custB = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyBAdminToken}`)
      .send({ name: 'Beacon Client B', email: 'clientb@beacon.com' });

    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${companyBAdminToken}`)
      .send({ customerId: custB.body.data.id, title: 'Secret Beacon Deal', value: 999999, stage: 'WON' });
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Executive KPI Summary Endpoint (`GET /api/dashboard`)', () => {
    it('should return aggregated KPI metrics for Company A', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customers).toEqual(1);
      expect(res.body.data.leads).toEqual(2);
      expect(res.body.data.activeDeals).toEqual(1);
      expect(res.body.data.wonDeals).toEqual(1);
      expect(res.body.data.lostDeals).toEqual(1);
      expect(res.body.data.totalDealValue).toEqual(180000);
      expect(res.body.data.wonDealValue).toEqual(100000);
      expect(res.body.data.openTasks).toEqual(1);
    });

    it('CRITICAL TENANT ISOLATION: Company A dashboard should NEVER include Company B deal value', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.totalDealValue).not.toEqual(1179999);
      expect(res.body.data.totalDealValue).toEqual(180000);
    });
  });

  describe('2. Pipeline & Lead Analytics (`GET /api/dashboard/pipeline` & `/leads`)', () => {
    it('should return pipeline breakdown grouped by stage', async () => {
      const res = await request(app)
        .get('/api/dashboard/pipeline')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.WON.count).toEqual(1);
      expect(res.body.data.WON.value).toEqual(100000);
      expect(res.body.data.PROPOSAL.count).toEqual(1);
      expect(res.body.data.PROPOSAL.value).toEqual(50000);
      expect(res.body.data.LOST.count).toEqual(1);
    });

    it('should return lead breakdown by status, source, and priority', async () => {
      const res = await request(app)
        .get('/api/dashboard/leads')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.bySource.WEBSITE).toEqual(1);
      expect(res.body.data.bySource.REFERRAL).toEqual(1);
      expect(res.body.data.byPriority.HIGH).toEqual(1);
    });
  });

  describe('3. Deal Performance & Win Rate (`GET /api/dashboard/deals`)', () => {
    it('should calculate win rate correctly: 1 Won / (1 Won + 1 Lost) = 50.0%', async () => {
      const res = await request(app)
        .get('/api/dashboard/deals?period=30d')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.dealsCreated).toEqual(3);
      expect(res.body.data.dealsWon).toEqual(1);
      expect(res.body.data.dealsLost).toEqual(1);
      expect(res.body.data.winRate).toEqual(50);
      expect(res.body.data.timeSeries).toBeDefined();
    });
  });

  describe('4. Sales Performance Roster (`GET /api/dashboard/sales-performance`)', () => {
    it('should return sales performance for company employees only', async () => {
      const res = await request(app)
        .get('/api/dashboard/sales-performance')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].email).toEqual('arthur@apexfin.com');
    });
  });
});
