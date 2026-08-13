const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 5 — Global Search Engine Integration Suite', () => {
  let companyAAdminToken;
  let companyBAdminToken;

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
        companyName: 'Google Partner Corp',
        name: 'Garry Guide',
        email: 'garry@googlepartner.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Competitor Inc',
        name: 'Charlie Chief',
        email: 'charlie@competitor.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;

    // Seed Company A Entities containing "Google"
    const custA = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'Google India', email: 'contact@google.in', companyName: 'Google' });

    await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'Google Enterprise Lead', email: 'enterprise@google.com' });

    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ customerId: custA.body.data.id, title: 'Google CRM Contract', value: 250000 });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ title: 'Follow up with Google team', priority: 'HIGH' });

    await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ customerId: custA.body.data.id, title: 'Google Sync Meeting', date: '2026-09-10', startTime: '14:00', endTime: '15:00' });

    // Seed Company B Entity containing "Google"
    const custB = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyBAdminToken}`)
      .send({ name: 'Google Confidential B', email: 'secret@googleb.com' });

    await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${companyBAdminToken}`)
      .send({ customerId: custB.body.data.id, title: 'Google Rival Deal', value: 99999 });
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Global Multi-Entity Search (`GET /api/search?q=google`)', () => {
    it('should search across Customers, Leads, Deals, Tasks, and Meetings for Company A', async () => {
      const res = await request(app)
        .get('/api/search?q=google')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customers.length).toEqual(1);
      expect(res.body.data.customers[0].name).toEqual('Google India');

      expect(res.body.data.leads.length).toEqual(1);
      expect(res.body.data.leads[0].name).toEqual('Google Enterprise Lead');

      expect(res.body.data.deals.length).toEqual(1);
      expect(res.body.data.deals[0].title).toEqual('Google CRM Contract');

      expect(res.body.data.tasks.length).toEqual(1);
      expect(res.body.data.tasks[0].title).toEqual('Follow up with Google team');

      expect(res.body.data.meetings.length).toEqual(1);
      expect(res.body.data.meetings[0].title).toEqual('Google Sync Meeting');
    });

    it('CRITICAL TENANT ISOLATION: User A search should NEVER return Company B confidential records', async () => {
      const res = await request(app)
        .get('/api/search?q=google')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      const customerNames = res.body.data.customers.map(c => c.name);
      expect(customerNames).not.toContain('Google Confidential B');

      const dealTitles = res.body.data.deals.map(d => d.title);
      expect(dealTitles).not.toContain('Google Rival Deal');
    });

    it('should return empty result arrays when query string matches nothing', async () => {
      const res = await request(app)
        .get('/api/search?q=nonexistentxyz999')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.customers).toEqual([]);
      expect(res.body.data.leads).toEqual([]);
      expect(res.body.data.deals).toEqual([]);
      expect(res.body.data.tasks).toEqual([]);
      expect(res.body.data.meetings).toEqual([]);
    });
  });
});
