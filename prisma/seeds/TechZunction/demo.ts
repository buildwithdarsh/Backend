import { PrismaClient } from '@prisma/client';

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

export async function seedTechZunctionDemo(prisma: PrismaClient) {
  console.log('\n── TechZunction (Website) demo data ──');
  const org = await prisma.organization.findFirst({ where: { slug: 'techzunction' } });
  if (!org) { console.log('  ~ techzunction org not in backend — skipping'); return; }

  const contacts = [
    { name: 'Aryan Shah', email: 'aryan.shah@startup.io', phone: '9860006001', subject: 'Mobile App Development', service: 'mobile', budget: '5-10L', message: 'Looking for an end-to-end mobile app for our fintech startup. Timeline: 3 months.' },
    { name: 'Ritu Choudhary', email: 'ritu.c@enterprise.com', phone: '9860006002', subject: 'SaaS Platform Build', service: 'web', budget: '10-25L', message: 'We need a multi-tenant SaaS dashboard. Prefer a team with NestJS and Next.js experience.' },
    { name: 'Sameer Wagh', email: 'sameer@agency.in', phone: '9860006003', subject: 'UI/UX Redesign', service: 'design', budget: '1-5L', message: 'Our admin panel needs a complete overhaul. Current stack is React. Would love to see portfolio.' },
    { name: 'Tanvi Kulkarni', email: 'tanvi.k@edtech.com', phone: '9860006004', subject: 'EdTech Platform', service: 'web', budget: '5-10L', message: 'Building a learning management system with live classes, quizzes, and progress tracking.' },
    { name: 'Deepak Nambiar', email: 'deepak@logistics.co', phone: '9860006005', subject: 'Fleet Management System', service: 'web', budget: '25L+', message: 'Need a real-time fleet tracking and dispatch system for 500+ vehicles across 10 cities.' },
    { name: 'Priyanka Iyer', email: 'priyanka.i@retail.com', phone: '9860006006', subject: 'E-commerce Platform', service: 'web', budget: '10-25L', message: 'D2C brand with 50k orders/month — need a custom platform, current Shopify is limiting us.' },
    { name: 'Ankit Srivastava', email: 'ankit.s@healthtech.in', phone: '9860006007', subject: 'Healthcare App', service: 'mobile', budget: '5-10L', message: 'Patient consultation app with video calls, prescriptions, and pharmacy integration.' },
    { name: 'Simran Grewal', email: 'simran.g@realestate.in', phone: '9860006008', subject: 'Property Management', service: 'web', budget: '5-10L', message: 'Tenant-landlord portal with rent collection, maintenance tickets, and document management.' },
  ];

  for (const c of contacts) {
    await prisma.contactMessage.create({
      data: {
        orgId: org.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        subject: c.subject,
        service: c.service,
        budget: c.budget,
        message: c.message,
        isRead: Math.random() > 0.5,
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    } as never);
  }
  console.log(`  ✓ ${contacts.length} contact messages`);
}
