const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 6 — File Storage & Document Management Suite', () => {
  let companyAAdminToken;
  let companyAUser;
  let companyAId;
  let customerAId;
  let fileAId;

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
        companyName: 'Docu Corp',
        name: 'David Doc',
        email: 'david@docucorp.com',
        password: 'Password123!'
      });
    companyAAdminToken = resA.body.accessToken;
    companyAUser = resA.body.user;
    companyAId = resA.body.company.id;

    // Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Secure Files Inc',
        name: 'Sally Secure',
        email: 'sally@securefiles.com',
        password: 'Password123!'
      });
    companyBAdminToken = resB.body.accessToken;
    companyBUser = resB.body.user;
    companyBId = resB.body.company.id;

    // Create Customer for Company A
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${companyAAdminToken}`)
      .send({ name: 'File Test Customer', email: 'filecustomer@test.com' });
    customerAId = custRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. File Upload & Validation', () => {
    it('should successfully upload a PDF document linked to a Customer', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Test PDF content');

      const res = await request(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .field('entityType', 'CUSTOMER')
        .field('entityId', customerAId)
        .attach('file', pdfBuffer, 'contract_v1.pdf');

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileName).toEqual('contract_v1.pdf');
      expect(res.body.data.entityType).toEqual('CUSTOMER');
      expect(res.body.data.entityId).toEqual(customerAId);

      fileAId = res.body.data.id;
    });

    it('should REJECT file upload with unsupported file type (.exe)', async () => {
      const exeBuffer = Buffer.from('MZ executable buffer');

      const res = await request(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .attach('file', exeBuffer, 'virus.exe');

      expect(res.statusCode).toEqual(400);
      expect(res.body.errorCode).toEqual('UNSUPPORTED_FILE_TYPE');
    });

    it('should REJECT file upload linked to non-existent or cross-tenant entity', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Fake Entity');

      const res = await request(app)
        .post('/api/files')
        .set('Authorization', `Bearer ${companyAAdminToken}`)
        .field('entityType', 'CUSTOMER')
        .field('entityId', '00000000-0000-0000-0000-000000000000')
        .attach('file', pdfBuffer, 'fake.pdf');

      expect(res.statusCode).toEqual(404);
      expect(res.body.errorCode).toEqual('TENANT_ACCESS_DENIED');
    });
  });

  describe('2. File Retrieval & Streaming Download', () => {
    it('should list files for current company tenant', async () => {
      const res = await request(app)
        .get('/api/files?entityType=CUSTOMER')
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(1);
      expect(res.body.data[0].id).toEqual(fileAId);
    });

    it('should download file stream securely', async () => {
      const res = await request(app)
        .get(`/api/files/${fileAId}/download`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="contract_v1.pdf"');
    });
  });

  describe('3. Multi-Tenant Security Isolation', () => {
    it('CRITICAL: User B should NOT be able to view or download User A file', async () => {
      const viewRes = await request(app)
        .get(`/api/files/${fileAId}`)
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(viewRes.statusCode).toEqual(404);

      const downloadRes = await request(app)
        .get(`/api/files/${fileAId}/download`)
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(downloadRes.statusCode).toEqual(404);

      const deleteRes = await request(app)
        .delete(`/api/files/${fileAId}`)
        .set('Authorization', `Bearer ${companyBAdminToken}`);

      expect(deleteRes.statusCode).toEqual(404);
    });
  });

  describe('4. File Soft Deletion', () => {
    it('should soft-delete file and update usage counter', async () => {
      const delRes = await request(app)
        .delete(`/api/files/${fileAId}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(delRes.statusCode).toEqual(200);

      const getRes = await request(app)
        .get(`/api/files/${fileAId}`)
        .set('Authorization', `Bearer ${companyAAdminToken}`);

      expect(getRes.statusCode).toEqual(404);
    });
  });
});
