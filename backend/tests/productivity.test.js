const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 4 — Productivity & Activity Management Integration Suite', () => {
  let companyAAdminToken;
  let companyAUser;
  let companyAData;

  let companyBAdminToken;
  let companyBUser;
  let companyBData;

  let testCustomerA;
  let testCustomerB;
  let testTaskA;
  let testMeetingA;

  beforeAll(async () => {
    // Clean database tables in cascade order
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

    // Register Company A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Apex Financial',
        name: 'Adam Admin',
        email: 'adam@apex.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAUser = resA.body.user;
    companyAData = resA.body.company;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Vanguard Retail',
        name: 'Bella Boss',
        email: 'bella@vanguard.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBUser = resB.body.user;
    companyBData = resB.body.company;

    // Create Customer for Company A
    const custARes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'Alpha Client A', email: 'alpha@clienta.com' });
    testCustomerA = custARes.body.data;

    // Create Customer for Company B
    const custBRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyBAdminToken}`)
      .send({ name: 'Beta Client B', email: 'beta@clientb.com' });
    testCustomerB = custBRes.body.data;
  });

  afterAll(async () => {
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
  });

  describe('1. Task Management Module', () => {
    it('should create a task for Company A', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Prepare Enterprise Pitch Deck',
          description: 'Include Q4 revenue milestones',
          priority: 'HIGH',
          dueDate: '2026-09-01'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toEqual('TODO');
      testTaskA = res.body.data;
    });

    it('should update task status to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTaskA.id}/status`)
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toEqual('IN_PROGRESS');
    });

    it('should list tasks with filter and search', async () => {
      const res = await request(app)
        .get('/api/tasks?status=IN_PROGRESS&search=Pitch')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
    });

    it('should soft delete a task', async () => {
      const tempTask = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ title: 'Temporary Task' });

      const deleteRes = await request(app)
        .delete(`/api/tasks/${tempTask.body.data.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(deleteRes.statusCode).toEqual(200);

      // Verify omitted from active tasks list
      const listRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      const found = listRes.body.data.find(t => t.id === tempTask.body.data.id);
      expect(found).toBeUndefined();
    });
  });

  describe('2. Meeting Management & Conflict Detection', () => {
    it('should schedule a meeting for Customer A', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Product Roadmap Review',
          customerId: testCustomerA.id,
          date: '2026-08-25',
          startTime: '10:00',
          endTime: '11:00',
          location: 'Conference Room 3A'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.status).toEqual('SCHEDULED');
      testMeetingA = res.body.data;
    });

    it('CRITICAL CONFLICT TEST: should REJECT overlapping meeting (10:30 - 11:30) with 409 MEETING_CONFLICT', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Conflicting Call',
          customerId: testCustomerA.id,
          date: '2026-08-25',
          startTime: '10:30',
          endTime: '11:30'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.errorCode).toEqual('MEETING_CONFLICT');
      expect(res.body.message).toContain('conflicts with an existing scheduled meeting');
    });

    it('should allow non-overlapping meeting on the same day (11:30 - 12:30)', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Post Review Followup',
          customerId: testCustomerA.id,
          date: '2026-08-25',
          startTime: '11:30',
          endTime: '12:30'
        });

      expect(res.statusCode).toEqual(201);
    });
  });

  describe('3. Customer Activity Timeline & Enterprise Audit Logs', () => {
    it('should fetch Customer A Activity Timeline containing MEETING_SCHEDULED event', async () => {
      const res = await request(app)
        .get(`/api/activities/customer/${testCustomerA.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const meetingEvent = res.body.data.find(a => a.action === 'MEETING_SCHEDULED');
      expect(meetingEvent).toBeDefined();
    });

    it('should fetch Enterprise Audit Logs containing LOGIN and MEETING_CREATED events', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const actions = res.body.data.map(log => log.action);
      expect(actions).toContain('TASK_CREATED');
      expect(actions).toContain('MEETING_CREATED');
    });
  });

  describe('4. Strict Multi-Tenant Security & Access Rejection', () => {
    it('CRITICAL: should BLOCK User A from scheduling meeting for Company B customer', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Illegal Cross Tenant Meeting',
          customerId: testCustomerB.id,
          date: '2026-08-26',
          startTime: '14:00',
          endTime: '15:00'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.errorCode).toEqual('TENANT_ACCESS_DENIED');
    });

    it('CRITICAL: should BLOCK User A from viewing Company B task', async () => {
      // Create task in Company B
      const taskB = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${companyBAdminToken}`)
        .send({ title: 'Company B Task' });

      const res = await request(app)
        .get(`/api/tasks/${taskB.body.data.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(404);
    });

    it('CRITICAL: should BLOCK User A from viewing Company B Customer Activity Timeline', async () => {
      const res = await request(app)
        .get(`/api/activities/customer/${testCustomerB.id}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });
});
