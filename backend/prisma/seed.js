const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  // Clean existing tables
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

  const passHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Company A (Acme SaaS Solutions)
  const companyA = await prisma.company.create({
    data: {
      name: 'Acme SaaS Solutions',
      email: 'contact@acmesaass.com',
      phone: '+1-555-0100',
      industry: 'Software & Technology',
      address: '100 Innovation Way, San Francisco, CA',
      subscriptionPlan: 'PREMIUM',
      status: 'ACTIVE'
    }
  });

  await prisma.subscription.create({
    data: { companyId: companyA.id, plan: 'PREMIUM', status: 'ACTIVE' }
  });
  await prisma.usage.create({
    data: { companyId: companyA.id, usersCount: 2, customersCount: 2, leadsCount: 2, dealsCount: 2, tasksCount: 2, storageBytes: 1024 }
  });

  // 2. Create Users for Company A
  const adminA = await prisma.user.create({
    data: {
      companyId: companyA.id,
      name: 'Alice Manager',
      email: 'alice@acmesaass.com',
      passwordHash: passHash,
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE'
    }
  });

  const execA = await prisma.user.create({
    data: {
      companyId: companyA.id,
      name: 'Bob Executive',
      email: 'bob@acmesaass.com',
      passwordHash: passHash,
      role: 'SALES_EXECUTIVE',
      status: 'ACTIVE'
    }
  });

  // 3. Create Super Admin User
  await prisma.user.create({
    data: {
      companyId: companyA.id,
      name: 'Global Platform Admin',
      email: 'superadmin@platform.com',
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });

  // 4. Create Customers, Leads, Deals for Company A
  const cust1 = await prisma.customer.create({
    data: {
      companyId: companyA.id,
      name: 'Apex Global Corp',
      email: 'info@apexglobal.com',
      phone: '+1-555-0201',
      companyName: 'Apex Global Ltd',
      industry: 'Finance',
      status: 'ACTIVE',
      assignedToId: adminA.id
    }
  });

  const lead1 = await prisma.lead.create({
    data: {
      companyId: companyA.id,
      name: 'Charlie Prospect',
      email: 'charlie@prospectinc.com',
      notes: 'Prospect Inc Lead',
      status: 'QUALIFIED',
      priority: 'HIGH',
      assignedToId: execA.id
    }
  });

  await prisma.deal.create({
    data: {
      companyId: companyA.id,
      title: 'Enterprise CRM Migration Contract',
      value: 75000,
      stage: 'NEGOTIATION',
      probability: 80,
      customerId: cust1.id,
      assignedToId: adminA.id
    }
  });

  // 5. Create Tasks & Meetings
  await prisma.task.create({
    data: {
      companyId: companyA.id,
      title: 'Send Q4 Proposal Document',
      description: 'Review SLA terms and email final PDF proposal',
      priority: 'HIGH',
      status: 'TODO',
      dueDate: new Date(Date.now() + 86400000),
      assignedToId: execA.id,
      createdById: adminA.id
    }
  });

  await prisma.meeting.create({
    data: {
      companyId: companyA.id,
      customerId: cust1.id,
      title: 'Executive Sales Demo',
      notes: 'Demonstrate pipeline analytics and role-based permissions',
      date: new Date(Date.now() + 172800000),
      startTime: '10:00',
      endTime: '11:00',
      status: 'SCHEDULED',
      createdById: adminA.id
    }
  });

  console.log('✅ Seed data successfully populated!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
