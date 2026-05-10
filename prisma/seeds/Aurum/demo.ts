import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const DEMO_PASSWORD = 'Demo@1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

export async function seedAurumDemo(prisma: PrismaClient) {
  console.log('\n── Aurum demo data ──');
  const org = await prisma.organization.findUnique({ where: { slug: 'aurum' } });
  if (!org) { console.log('  ✗ aurum org not found'); return; }

  const pwHash = await hash(DEMO_PASSWORD, 10);

  const demoUser = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: org.id, email: 'demo@aurum.in' } } as never,
    update: {},
    create: {
      orgId: org.id,
      name: 'Ishaan Mehta',
      email: 'demo@aurum.in',
      phone: '9830003001',
      passwordHash: pwHash,
      isEmailVerified: true,
      isPhoneVerified: true,
      status: 'active',
    },
  });
  console.log(`  ✓ Demo user: demo@aurum.in`);

  // KYC
  await prisma.kycVerification.upsert({
    where: { orgId_endUserId_documentType: { orgId: org.id, endUserId: demoUser.id, documentType: 'aadhaar' } } as never,
    update: {},
    create: { orgId: org.id, endUserId: demoUser.id, documentType: 'aadhaar', documentNumber: '9876 5432 1098', status: 'verified', verifiedAt: daysAgo(60) },
  });
  await prisma.kycVerification.upsert({
    where: { orgId_endUserId_documentType: { orgId: org.id, endUserId: demoUser.id, documentType: 'pan' } } as never,
    update: {},
    create: { orgId: org.id, endUserId: demoUser.id, documentType: 'pan', documentNumber: 'ABCDE1234F', status: 'verified', verifiedAt: daysAgo(60) },
  });
  console.log('  ✓ 2 KYC verifications');

  // Bank accounts
  const savings = await prisma.bankAccount.upsert({
    where: { orgId_accountNumber: { orgId: org.id, accountNumber: `DEMO${demoUser.id.slice(0, 8)}S` } } as never,
    update: { balance: 247850.75 },
    create: {
      orgId: org.id, endUserId: demoUser.id,
      accountNumber: `DEMO${demoUser.id.slice(0, 8)}S`,
      ifscCode: 'AURM0001234',
      accountType: 'savings', status: 'active',
      nickname: 'Primary Savings', balance: 247850.75,
      isPrimary: true,
    },
  } as never);

  const current = await prisma.bankAccount.upsert({
    where: { orgId_accountNumber: { orgId: org.id, accountNumber: `DEMO${demoUser.id.slice(0, 8)}C` } } as never,
    update: { balance: 512340.00 },
    create: {
      orgId: org.id, endUserId: demoUser.id,
      accountNumber: `DEMO${demoUser.id.slice(0, 8)}C`,
      ifscCode: 'AURM0001234',
      accountType: 'current', status: 'active',
      nickname: 'Business Account', balance: 512340.00,
    },
  } as never);
  console.log('  ✓ 2 bank accounts');

  // Check for existing transactions to avoid duplicates
  const existingCount = await prisma.bankTransaction.count({ where: { orgId: org.id, endUserId: demoUser.id } });
  if (existingCount < 10) {
    const counterparties = [
      { name: 'Swiggy', account: 'SWG001', ifsc: 'HDFC0001' },
      { name: 'Amazon India', account: 'AMZ001', ifsc: 'ICIC0001' },
      { name: 'Reliance Jio', account: 'JIO001', ifsc: 'SBIN0001' },
      { name: 'Zomato', account: 'ZOM001', ifsc: 'AXIS0001' },
      { name: 'Netflix India', account: 'NFX001', ifsc: 'HDFC0002' },
      { name: 'Flipkart', account: 'FLP001', ifsc: 'UTIB0001' },
      { name: 'MakeMyTrip', account: 'MMT001', ifsc: 'YESB0001' },
      { name: 'Uber India', account: 'UBR001', ifsc: 'KOTAK001' },
      { name: 'MPEB Electricity', account: 'MPB001', ifsc: 'BARB0001' },
      { name: 'BookMyShow', account: 'BMS001', ifsc: 'KKBK0001' },
      { name: 'Salary Credit', account: 'CORP001', ifsc: 'ICIC0002' },
      { name: 'Freelance Payment', account: 'FREE001', ifsc: 'HDFC0003' },
    ];
    const categories = ['food', 'shopping', 'utilities', 'entertainment', 'travel', 'salary'];
    const txTypes = ['credit', 'debit', 'debit', 'debit', 'debit', 'debit', 'credit'];
    const modes = ['upi', 'upi', 'imps', 'neft', 'upi', 'imps', 'internal'];

    for (let i = 0; i < 80; i++) {
      const cp = counterparties[i % counterparties.length]!;
      const type = txTypes[i % txTypes.length]!;
      const amount = type === 'credit'
        ? Math.round((Math.random() * 40000 + 10000) * 100) / 100
        : Math.round((Math.random() * 3000 + 100) * 100) / 100;

      await prisma.bankTransaction.create({
        data: {
          orgId: org.id,
          endUserId: demoUser.id,
          accountId: i % 3 === 0 ? current.id : savings.id,
          type,
          amount,
          currency: 'INR',
          balanceAfter: type === 'credit' ? 247850.75 + amount : 247850.75 - amount,
          mode: modes[i % modes.length] as never,
          status: 'completed' as never,
          category: categories[i % categories.length]!,
          description: `${type === 'credit' ? 'Payment received from' : 'Payment to'} ${cp.name}`,
          counterpartyName: cp.name,
          counterpartyAccount: cp.account,
          counterpartyIfsc: cp.ifsc,
          createdAt: daysAgo(Math.floor(Math.random() * 90)),
        },
      });
    }
    console.log('  ✓ 80 bank transactions');
  } else {
    console.log('  ~ transactions already seeded');
  }
}
