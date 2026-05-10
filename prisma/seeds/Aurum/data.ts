import { PrismaClient, Prisma } from '@prisma/client';
import { hash } from 'bcrypt';

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
  return d;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export async function seedAurumData(prisma: PrismaClient) {
  console.log('Seeding Aurum banking sample data...\n');

  // Look up org dynamically instead of hardcoding
  const org = await prisma.organization.findUnique({ where: { slug: 'aurum' } });
  if (!org) throw new Error('Aurum org not found — run seedAurumOrg first');
  const ORG_ID = org.id;

  // Ensure the end user exists
  const pwHash = await hash('Test@1234', 10);
  const endUser = await prisma.endUser.upsert({
    where: { orgId_email: { orgId: ORG_ID, email: 'data@aurum.in' } } as never,
    update: {},
    create: {
      orgId: ORG_ID,
      name: 'Aurum Data User',
      email: 'data@aurum.in',
      phone: '9830003002',
      passwordHash: pwHash,
      isPhoneVerified: true,
      isEmailVerified: true,
      status: 'active',
    },
  });
  const END_USER_ID = endUser.id;
  console.log(`  ✓ End user: ${END_USER_ID}`);

  // ─── 1. KYC Verifications ─────────────────────────────────────────
  console.log('Creating KYC verifications...');
  await prisma.kycVerification.upsert({
    where: { orgId_endUserId_documentType: { orgId: ORG_ID, endUserId: END_USER_ID, documentType: 'aadhaar' } } as never,
    update: {},
    create: { orgId: ORG_ID, endUserId: END_USER_ID, documentType: 'aadhaar', documentNumber: '9876 5432 1098', status: 'verified', verifiedAt: new Date('2026-01-15') },
  });
  await prisma.kycVerification.upsert({
    where: { orgId_endUserId_documentType: { orgId: ORG_ID, endUserId: END_USER_ID, documentType: 'pan' } } as never,
    update: {},
    create: { orgId: ORG_ID, endUserId: END_USER_ID, documentType: 'pan', documentNumber: 'ABCDE1234F', status: 'verified', verifiedAt: new Date('2026-01-15') },
  });
  console.log('  ✓ 2 KYC verifications (Aadhaar + PAN)');

  // ─── 2. Bank Accounts ─────────────────────────────────────────────
  console.log('\nCreating bank accounts...');
  const savingsAccount = await prisma.bankAccount.upsert({
    where: { orgId_accountNumber: { orgId: ORG_ID, accountNumber: '10012345678' } },
    update: { balance: 247850.75 },
    create: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      accountNumber: '10012345678', ifscCode: 'AURM0001234',
      accountType: 'savings', status: 'active',
      nickname: 'Primary Savings', balance: 247850.75,
      isPrimary: true,
    },
  });

  const currentAccount = await prisma.bankAccount.upsert({
    where: { orgId_accountNumber: { orgId: ORG_ID, accountNumber: '20098765432' } },
    update: { balance: 512340.00 },
    create: {
      orgId: ORG_ID, endUserId: END_USER_ID,
      accountNumber: '20098765432', ifscCode: 'AURM0001234',
      accountType: 'current', status: 'active',
      nickname: 'Business Current', balance: 512340.00,
      autoSweepEnabled: true, autoSweepThreshold: 100000,
    },
  });
  console.log(`  ✓ Savings: ${savingsAccount.id}`);
  console.log(`  ✓ Current: ${currentAccount.id}`);

  // ─── 3. Transactions (100 entries) ────────────────────────────────
  console.log('\nCreating 100 transactions...');

  const categories = ['food', 'travel', 'utilities', 'shopping', 'entertainment', 'health', 'education', 'transfer', 'salary', 'freelance'];
  const modes: Array<'neft' | 'rtgs' | 'imps' | 'upi' | 'internal'> = ['neft', 'imps', 'upi', 'upi', 'upi', 'imps', 'internal'];
  const counterparties = [
    { name: 'Swiggy', account: '33001234567', ifsc: 'HDFC0001234' },
    { name: 'Amazon India', account: '44001234567', ifsc: 'ICIC0001234' },
    { name: 'Reliance Jio', account: '55001234567', ifsc: 'SBIN0001234' },
    { name: 'MPEB Electricity', account: '66001234567', ifsc: 'BARB0001234' },
    { name: 'Flipkart', account: '77001234567', ifsc: 'UTIB0001234' },
    { name: 'BookMyShow', account: '88001234567', ifsc: 'KKBK0001234' },
    { name: 'MakeMyTrip', account: '99001234567', ifsc: 'YESB0001234' },
    { name: 'Apollo Pharmacy', account: '11101234567', ifsc: 'HDFC0005678' },
    { name: 'Zomato', account: '12201234567', ifsc: 'ICIC0005678' },
    { name: 'Uber India', account: '13301234567', ifsc: 'SBIN0005678' },
  ];

  const creditDescriptions = [
    'Salary credited', 'Freelance payment received', 'Refund from Amazon',
    'Interest credit', 'Cashback reward', 'Transfer from savings',
    'Client payment - Invoice #4521', 'Dividend credit', 'Rental income',
    'UPI collect received',
  ];

  const debitDescriptions: Record<string, string[]> = {
    food: ['Swiggy order', 'Zomato delivery', 'Restaurant bill', 'Grocery - BigBasket', 'Coffee - Starbucks'],
    travel: ['Uber ride', 'MakeMyTrip booking', 'Petrol fill-up', 'Ola ride', 'IRCTC ticket'],
    utilities: ['Electricity bill - MPEB', 'Water bill', 'Gas bill - Indane', 'Broadband - Airtel', 'Mobile recharge - Jio'],
    shopping: ['Amazon order', 'Flipkart purchase', 'Myntra order', 'Decathlon sports', 'Croma electronics'],
    entertainment: ['BookMyShow tickets', 'Netflix subscription', 'Spotify premium', 'Disney+ Hotstar', 'YouTube Premium'],
    health: ['Apollo Pharmacy', 'Doctor consultation', 'Lab test - Thyrocare', 'Gym membership', 'Health insurance premium'],
    education: ['Coursera subscription', 'Book purchase', 'Udemy course', 'Exam fee', 'Coaching fee'],
    transfer: ['Transfer to Mom', 'Transfer to savings', 'Rent payment', 'EMI payment', 'Society maintenance'],
  };

  let runningBalance = 247850.75;
  const txnData: Prisma.BankTransactionCreateManyInput[] = [];

  for (let i = 0; i < 100; i++) {
    const isCredit = Math.random() < 0.3; // 30% credits, 70% debits
    const category = isCredit ? randomPick(['salary', 'freelance', 'transfer']) : randomPick(categories.filter((c) => c !== 'salary' && c !== 'freelance'));
    const amount = isCredit
      ? randomBetween(5000, 85000)
      : randomBetween(50, 15000);

    runningBalance = isCredit ? runningBalance + amount : runningBalance - amount;

    const counterparty = isCredit ? null : randomPick(counterparties);
    const description = isCredit
      ? randomPick(creditDescriptions)
      : randomPick(debitDescriptions[category] ?? ['Payment']);

    txnData.push({
      orgId: ORG_ID,
      accountId: savingsAccount.id,
      endUserId: END_USER_ID,
      type: isCredit ? 'credit' : 'debit',
      mode: randomPick(modes),
      amount,
      balanceAfter: Math.round(runningBalance * 100) / 100,
      description,
      referenceNumber: `TXN${Date.now().toString(36).toUpperCase()}${i.toString().padStart(3, '0')}`,
      counterpartyName: counterparty?.name ?? null,
      counterpartyAccount: counterparty?.account ?? null,
      counterpartyIfsc: counterparty?.ifsc ?? null,
      status: 'completed',
      category,
      createdAt: randomDate(180),
    });
  }

  // Sort by date
  txnData.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

  // Delete old sample txns and insert fresh
  await prisma.bankTransaction.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });
  await prisma.bankTransaction.createMany({ data: txnData });
  console.log('  ✓ 100 transactions seeded');

  // ─── 4. Beneficiaries (10) ────────────────────────────────────────
  console.log('\nCreating beneficiaries...');
  const beneficiaries = [
    { name: 'Rahul Sharma', account: '50012345678', ifsc: 'HDFC0001234', bank: 'HDFC Bank', isFavorite: true },
    { name: 'Priya Patel', account: '50023456789', ifsc: 'ICIC0001234', bank: 'ICICI Bank', isFavorite: true },
    { name: 'Amit Kumar', account: '50034567890', ifsc: 'SBIN0001234', bank: 'SBI', isFavorite: false },
    { name: 'Neha Gupta', account: '50045678901', ifsc: 'KKBK0001234', bank: 'Kotak Mahindra', isFavorite: false },
    { name: 'Vikram Singh', account: '50056789012', ifsc: 'UTIB0001234', bank: 'Axis Bank', isFavorite: true },
    { name: 'Sunita Devi', account: '50067890123', ifsc: 'BARB0001234', bank: 'Bank of Baroda', isFavorite: false },
    { name: 'Rajesh Verma', account: '50078901234', ifsc: 'PUNB0001234', bank: 'PNB', isFavorite: false },
    { name: 'Deepika Nair', account: '50089012345', ifsc: 'YESB0001234', bank: 'Yes Bank', isFavorite: false },
    { name: 'Landlord - Mr. Joshi', account: '50090123456', ifsc: 'HDFC0005678', bank: 'HDFC Bank', isFavorite: true, nickname: 'Rent' },
    { name: 'Mom', account: '50001234567', ifsc: 'SBIN0005678', bank: 'SBI', isFavorite: true, nickname: 'Mom' },
  ];

  await prisma.beneficiary.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });
  for (const b of beneficiaries) {
    await prisma.beneficiary.create({
      data: {
        orgId: ORG_ID, endUserId: END_USER_ID,
        name: b.name, accountNumber: b.account, ifscCode: b.ifsc,
        bankName: b.bank, isFavorite: b.isFavorite, isVerified: true,
        nickname: (b as { nickname?: string }).nickname ?? null,
      },
    });
  }
  console.log('  ✓ 10 beneficiaries');

  // ─── 5. Bank Cards (3) ────────────────────────────────────────────
  console.log('\nCreating bank cards...');
  await prisma.bankCard.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  await prisma.bankCard.createMany({
    data: [
      {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: savingsAccount.id,
        cardType: 'debit', variant: 'physical', status: 'active',
        lastFourDigits: '4521', cardNetwork: 'visa',
        expiryMonth: 8, expiryYear: 2029, nameOnCard: 'TECHZUNCTION',
        dailyLimit: 200000, contactlessEnabled: true, onlineEnabled: true,
        internationalEnabled: false, atmWithdrawalLimit: 50000,
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: savingsAccount.id,
        cardType: 'debit', variant: 'virtual', status: 'active',
        lastFourDigits: '8834', cardNetwork: 'rupay',
        expiryMonth: 3, expiryYear: 2031, nameOnCard: 'TECHZUNCTION',
        dailyLimit: 100000, contactlessEnabled: false, onlineEnabled: true,
        internationalEnabled: false, atmWithdrawalLimit: 0,
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: null,
        cardType: 'credit', variant: 'physical', status: 'active',
        lastFourDigits: '7712', cardNetwork: 'mastercard',
        expiryMonth: 12, expiryYear: 2028, nameOnCard: 'TECHZUNCTION',
        dailyLimit: 500000, contactlessEnabled: true, onlineEnabled: true,
        internationalEnabled: true,
        internationalFrom: new Date('2026-03-01'),
        internationalUntil: new Date('2026-04-30'),
        atmWithdrawalLimit: 25000,
      },
    ],
  });
  console.log('  ✓ 3 cards (Visa debit, RuPay virtual, Mastercard credit)');

  // ─── 6. Fixed Deposits (3) ────────────────────────────────────────
  console.log('\nCreating fixed deposits...');
  await prisma.fixedDeposit.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  await prisma.fixedDeposit.createMany({
    data: [
      {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: savingsAccount.id,
        fdNumber: 'FD20260101A', principalAmount: 100000, interestRate: 6.5,
        tenureDays: 365, maturityAmount: 106500, maturityDate: new Date('2027-01-01'),
        status: 'active', autoRenew: true,
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: savingsAccount.id,
        fdNumber: 'FD20260215B', principalAmount: 50000, interestRate: 7.0,
        tenureDays: 730, maturityAmount: 57000, maturityDate: new Date('2028-02-15'),
        status: 'active', autoRenew: false,
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: currentAccount.id,
        fdNumber: 'FD20260301C', principalAmount: 200000, interestRate: 5.5,
        tenureDays: 180, maturityAmount: 205424.66, maturityDate: new Date('2026-08-28'),
        status: 'active', autoRenew: true,
      },
    ],
  });
  console.log('  ✓ 3 fixed deposits');

  // ─── 7. Scheduled Transfers (3) ──────────────────────────────────
  console.log('\nCreating scheduled transfers...');
  await prisma.scheduledTransfer.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  await prisma.scheduledTransfer.createMany({
    data: [
      {
        orgId: ORG_ID, endUserId: END_USER_ID, senderAccountId: savingsAccount.id,
        beneficiaryName: 'Mom', beneficiaryAccount: '50001234567', beneficiaryIfsc: 'SBIN0005678',
        amount: 10000, mode: 'imps', frequency: 'monthly', status: 'active',
        description: 'Monthly allowance to Mom',
        nextExecutionAt: new Date('2026-04-01'), executionCount: 5,
        lastExecutedAt: new Date('2026-03-01'),
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID, senderAccountId: savingsAccount.id,
        beneficiaryName: 'Landlord - Mr. Joshi', beneficiaryAccount: '50090123456', beneficiaryIfsc: 'HDFC0005678',
        amount: 25000, mode: 'neft', frequency: 'monthly', status: 'active',
        description: 'Rent payment',
        nextExecutionAt: new Date('2026-04-05'), executionCount: 3,
        lastExecutedAt: new Date('2026-03-05'),
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID, senderAccountId: currentAccount.id,
        beneficiaryName: 'Vikram Singh', beneficiaryAccount: '50056789012', beneficiaryIfsc: 'UTIB0001234',
        amount: 5000, mode: 'upi', frequency: 'weekly', status: 'active',
        description: 'Weekly contractor payment',
        nextExecutionAt: new Date('2026-03-24'), executionCount: 12,
        lastExecutedAt: new Date('2026-03-17'),
      },
    ],
  });
  console.log('  ✓ 3 scheduled transfers');

  // ─── 8. Bill Payments (8) ─────────────────────────────────────────
  console.log('\nCreating bill payment history...');
  await prisma.billPayment.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  const bills = [
    { category: 'electricity', name: 'MPEB Indore', consumer: 'MP09876543', amount: 2340 },
    { category: 'electricity', name: 'MPEB Indore', consumer: 'MP09876543', amount: 1890 },
    { category: 'mobile', name: 'Jio Prepaid', consumer: '7440958955', amount: 799 },
    { category: 'mobile', name: 'Jio Prepaid', consumer: '7440958955', amount: 799 },
    { category: 'insurance', name: 'LIC Premium', consumer: 'LIC29384756', amount: 12500 },
    { category: 'gas', name: 'Indane Gas', consumer: 'IND456789', amount: 1103 },
    { category: 'mobile', name: 'Airtel Broadband', consumer: 'AIR123456', amount: 1499 },
    { category: 'electricity', name: 'MPEB Indore', consumer: 'MP09876543', amount: 3120 },
  ];

  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i]!;
    await prisma.billPayment.create({
      data: {
        orgId: ORG_ID, endUserId: END_USER_ID, accountId: savingsAccount.id,
        billerCategory: bill.category, billerName: bill.name,
        consumerNumber: bill.consumer, amount: bill.amount,
        status: 'paid', referenceNumber: `BILL${i}${Date.now().toString(36).toUpperCase()}`,
        paidAt: randomDate(120),
      },
    });
  }
  console.log('  ✓ 8 bill payments');

  // ─── 9. Budgets (6) ──────────────────────────────────────────────
  console.log('\nCreating budgets...');
  await prisma.budget.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  const budgets = [
    { category: 'food', limit: 8000, alertAt: 80 },
    { category: 'travel', limit: 5000, alertAt: 75 },
    { category: 'utilities', limit: 6000, alertAt: 90 },
    { category: 'shopping', limit: 10000, alertAt: 80 },
    { category: 'entertainment', limit: 3000, alertAt: 85 },
    { category: 'health', limit: 4000, alertAt: 70 },
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: { orgId: ORG_ID, endUserId: END_USER_ID, category: b.category, monthlyLimit: b.limit, alertAt: b.alertAt },
    });
  }
  console.log('  ✓ 6 budgets');

  // ─── 10. Anomaly Alerts (5) ──────────────────────────────────────
  console.log('\nCreating anomaly alerts...');
  await prisma.anomalyAlert.deleteMany({ where: { orgId: ORG_ID, endUserId: END_USER_ID } });

  await prisma.anomalyAlert.createMany({
    data: [
      {
        orgId: ORG_ID, endUserId: END_USER_ID,
        alertType: 'unusual_amount', severity: 'high',
        title: 'Unusually large transaction detected',
        description: 'A debit of ₹14,500 to Amazon India is 3x higher than your average shopping transaction.',
        isRead: false, createdAt: randomDate(3),
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID,
        alertType: 'frequency_spike', severity: 'medium',
        title: 'Spending spike in Food category',
        description: 'You have made 8 food transactions today, which is significantly above your daily average of 2.',
        isRead: false, createdAt: randomDate(5),
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID,
        alertType: 'unusual_amount', severity: 'critical',
        title: 'Large UPI transfer detected',
        description: 'A UPI transfer of ₹50,000 was made to Vikram Singh. Confirm this was intentional.',
        isRead: true, createdAt: randomDate(10),
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID,
        alertType: 'frequency_spike', severity: 'low',
        title: 'Budget alert: Entertainment at 92%',
        description: 'You have used ₹2,760 of your ₹3,000 entertainment budget this month.',
        isRead: false, createdAt: randomDate(2),
      },
      {
        orgId: ORG_ID, endUserId: END_USER_ID,
        alertType: 'unusual_amount', severity: 'medium',
        title: 'New merchant detected',
        description: 'First-time payment of ₹6,200 to "Croma Electronics" — a merchant you haven\'t transacted with before.',
        isRead: true, isDismissed: true, createdAt: randomDate(15),
      },
    ],
  });
  console.log('  ✓ 5 anomaly alerts');

  console.log('\n✅ Aurum sample data seeded successfully!');
  console.log(`   Org: ${ORG_ID} (aurum)`);
  console.log(`   User: ${END_USER_ID} (data@aurum.in)`);
  console.log(`   Savings A/C: ${savingsAccount.accountNumber} (₹${savingsAccount.balance})`);
  console.log(`   Current A/C: ${currentAccount.accountNumber} (₹${currentAccount.balance})`);
}
