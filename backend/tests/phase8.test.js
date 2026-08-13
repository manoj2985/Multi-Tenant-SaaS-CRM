const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/db');

describe('Phase 8 — Automation, Customization, Webhooks & Developer API Test Suite', () => {
  let companyAToken, companyBToken;
  let userAId, userBId;
  let companyAId, companyBId;
  let apiKeySecretA;
  let webhookAId;
  let workflowAId;
  let customFieldAId;
  let tagAId;

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

    // 1. Register Company A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Automation Corp A',
        name: 'Adam Automation',
        email: 'adam@autocorpA.com',
        password: 'Password123!'
      });

    companyAToken = resA.body.accessToken;
    userAId = resA.body.user.id;
    companyAId = resA.body.company.id;

    // 2. Register Company B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        companyName: 'Automation Corp B',
        name: 'Bella Automation',
        email: 'bella@autocorpB.com',
        password: 'Password123!'
      });

    companyBToken = resB.body.accessToken;
    userBId = resB.body.user.id;
    companyBId = resB.body.company.id;
  });

  afterAll(async () => {
    await cleanDb();
  });

  describe('1. Workflow Automation Engine', () => {
    it('should create a workflow rule for Company A', async () => {
      const res = await request(app)
        .post('/api/workflows')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          name: 'High Value Deal Task Creation',
          entityType: 'DEAL',
          triggerType: 'DEAL_WON',
          conditions: [{ field: 'value', operator: 'GREATER_THAN', value: '50000' }],
          actions: [{ actionType: 'CREATE_TASK', configuration: { title: 'Onboard Enterprise Customer', priority: 'HIGH' } }]
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.name).toEqual('High Value Deal Task Creation');
      workflowAId = res.body.data.id;
    });

    it('should prevent Company B from accessing Company A workflow', async () => {
      const res = await request(app)
        .get(`/api/workflows/${workflowAId}`)
        .set('Authorization', `Bearer ${companyBToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('2. Custom Fields Engine', () => {
    it('should create custom field definition for Company A', async () => {
      const res = await request(app)
        .post('/api/custom-fields')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          entityType: 'CUSTOMER',
          name: 'annual_revenue',
          label: 'Annual Revenue',
          fieldType: 'NUMBER',
          isRequired: false
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.name).toEqual('annual_revenue');
      customFieldAId = res.body.data.id;
    });

    it('should list custom fields for Company A', async () => {
      const res = await request(app)
        .get('/api/custom-fields?entityType=CUSTOMER')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Tagging System', () => {
    it('should create tag and assign to customer', async () => {
      // Create Tag
      const tagRes = await request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ name: 'Enterprise', color: '#10b981' });

      expect(tagRes.statusCode).toEqual(201);
      tagAId = tagRes.body.data.id;

      // Create Customer
      const custRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ name: 'Tagged Customer Inc' });

      // Assign Tag
      const assignRes = await request(app)
        .post('/api/tags/assign')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ tagId: tagAId, entityType: 'CUSTOMER', entityId: custRes.body.data.id });

      expect(assignRes.statusCode).toEqual(200);
    });
  });

  describe('4. Advanced Search & Saved Filters', () => {
    it('should execute advanced search with conditions', async () => {
      const res = await request(app)
        .post('/api/search/advanced')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          entityType: 'CUSTOMER',
          filters: [{ field: 'name', operator: 'CONTAINS', value: 'Tagged' }],
          logic: 'AND'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. CSV Data Import & Export', () => {
    it('should preview and process CSV import', async () => {
      const csvData = 'name,email,companyName\nImported Client 1,client1@import.com,Import Corp';

      const previewRes = await request(app)
        .post('/api/import/preview')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ entityType: 'CUSTOMER', fileContent: csvData });

      expect(previewRes.statusCode).toEqual(200);
      expect(previewRes.body.data.totalRows).toEqual(1);

      const processRes = await request(app)
        .post('/api/import')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({ entityType: 'CUSTOMER', fileName: 'clients.csv', fileContent: csvData });

      expect(processRes.statusCode).toEqual(200);
      expect(processRes.body.data.successfulRows).toEqual(1);
    });

    it('should export CSV data', async () => {
      const res = await request(app)
        .get('/api/export?entityType=CUSTOMER')
        .set('Authorization', `Bearer ${companyAToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Imported Client 1');
    });
  });

  describe('6. Webhook Subscriptions & Deliveries', () => {
    it('should create webhook subscription for Company A', async () => {
      const res = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          name: 'Deals Webhook Listener',
          url: 'https://webhook.site/test-endpoint',
          events: ['DEAL_WON']
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.secret).toBeDefined();
      webhookAId = res.body.data.id;
    });

    it('should block Company B from toggling Company A webhook', async () => {
      const res = await request(app)
        .patch(`/api/webhooks/${webhookAId}/toggle`)
        .set('Authorization', `Bearer ${companyBToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('7. Developer API Keys & Scope Verification', () => {
    it('should generate API key for Company A and return raw secret key ONCE', async () => {
      const res = await request(app)
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${companyAToken}`)
        .send({
          name: 'Partner Integration Key',
          scopes: ['CUSTOMERS_READ', 'DEALS_READ']
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.secretKey).toContain('crm_live_');
      apiKeySecretA = res.body.data.secretKey;
    });

    it('should authenticate REST requests using Bearer API Key', async () => {
      const res = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${apiKeySecretA}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toBeDefined();
    });

    it('should reject API key from accessing Company B endpoints', async () => {
      // Attempting to query company details with Company A API key should reflect Company A context
      const res = await request(app)
        .get(`/api/v1/companies/${companyBId}`)
        .set('Authorization', `Bearer ${apiKeySecretA}`);

      expect(res.statusCode).toEqual(403);
    });
  });
});
