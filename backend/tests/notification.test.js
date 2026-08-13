const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 5 — Notification System & User Preferences Integration Suite', () => {
  let companyAAdminToken;
  let companyAUser;

  let companyBAdminToken;
  let companyBUser;

  let testNotificationId;

  async function cleanDb() {
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
        companyName: 'Notify Tech Corp',
        name: 'Noah Admin',
        email: 'noah@notifytech.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAUser = resA.body.user;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Silent Systems',
        name: 'Sam Silent',
        email: 'sam@silentsystems.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBUser = resB.body.user;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Automatic Triggers & Creation', () => {
    it('should automatically generate a TASK_ASSIGNED notification when a task is created for a user', async () => {
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Review Q4 Budget Strategy',
          assignedToId: companyAUser.id
        });

      expect(taskRes.statusCode).toEqual(201);

      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(notifRes.statusCode).toEqual(200);
      expect(notifRes.body.data.length).toBeGreaterThanOrEqual(1);

      const taskNotif = notifRes.body.data.find(n => n.type === 'TASK_ASSIGNED');
      expect(taskNotif).toBeDefined();
      expect(taskNotif.title).toEqual('New Task Assigned');
      testNotificationId = taskNotif.id;
    });

    it('should fetch unread notification count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Notification Read Status & Deletion', () => {
    let testNotifId;

    beforeAll(async () => {
      const notificationService = require('../src/services/notification.service');
      const notif = await notificationService.createNotification({
        companyId: companyAUser.companyId,
        userId: companyAUser.id,
        type: 'TASK_ASSIGNED',
        title: 'Test Read Status Notification',
        message: 'Test notification message body',
        entityType: 'Task',
        entityId: '00000000-0000-0000-0000-000000000000'
      });
      testNotifId = notif.id;
    });

    it('should mark a notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotifId}/read`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(countRes.body.unreadCount).toEqual(0);
    });

    it('should delete a notification', async () => {
      const deleteRes = await request(app)
        .delete(`/api/notifications/${testNotifId}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(deleteRes.statusCode).toEqual(200);
    });
  });

  describe('3. Notification Preferences & Suppression', () => {
    it('should fetch default user notification preferences', async () => {
      const res = await request(app)
        .get('/api/notification-preferences')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.taskNotifications).toBe(true);
      expect(res.body.data.leadNotifications).toBe(true);
    });

    it('should update user notification preferences (disable taskNotifications)', async () => {
      const res = await request(app)
        .put('/api/notification-preferences')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ taskNotifications: false });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.taskNotifications).toBe(false);
    });

    it('should SUPPRESS task notification creation when taskNotifications is false', async () => {
      // Clear existing notifications count
      const beforeCount = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      // Create another task assigned to user
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({
          title: 'Suppressed Notification Task',
          assignedToId: companyAUser.id
        });

      const afterCount = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      // Notification count should NOT have increased because preference was disabled
      expect(afterCount.body.data.length).toEqual(beforeCount.body.data.length);

      // Re-enable task notifications for subsequent tests
      await request(app)
        .put('/api/notification-preferences')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .send({ taskNotifications: true });
    });
  });

  describe('4. Strict User & Multi-Tenant Security Isolation', () => {
    it('CRITICAL: User A should NOT see or access User B notifications', async () => {
      // Trigger notification for User B in Company B
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${companyBAdminToken}`)
        .send({
          title: 'Secret Company B Task',
          assignedToId: companyBUser.id
        });

      const bNotifs = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      const bNotifId = bNotifs.body.data[0].id;

      // User A attempts to read User B's notification -> Should return 404 NOT_FOUND
      const hackRes = await request(app)
        .patch(`/api/notifications/${bNotifId}/read`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(hackRes.statusCode).toEqual(404);
    });
  });
});
