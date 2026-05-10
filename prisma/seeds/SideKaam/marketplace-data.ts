import { PrismaClient } from '@prisma/client';

const cities = ['Delhi', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Jaipur', 'Chennai', 'Kolkata', 'Ahmedabad', 'Indore', 'Lucknow', 'Chandigarh', 'Noida', 'Gurgaon', 'Bhopal'];
const categories = ['food', 'fashion', 'creative', 'tech', 'education', 'finance', 'fitness', 'local'];

const subcats: Record<string, string[]> = {
  food: ['Bakery / Cafe', 'Cloud kitchen', 'Tiffin service', 'Street food stall', 'Catering', 'Meal prep'],
  fashion: ['Boutique / Store', 'Tailoring', 'Jewellery making', 'Styling session', 'Reselling'],
  creative: ['Photography', 'Music session', 'Painting / Art', 'Mehendi art', 'Graphic design', 'Video production', 'Dance class'],
  tech: ['Web development', 'App building', 'UI/UX design', 'Social media', 'SEO / Marketing', 'Content writing'],
  education: ['School tuition', 'Exam coaching', 'Language teaching', 'Skill workshop', 'Career mentoring'],
  finance: ['GST / Tax filing', 'Bookkeeping', 'Financial planning', 'Insurance advisory', 'Legal documentation'],
  fitness: ['Yoga session', 'Personal training', 'Nutrition plan', 'Zumba / Dance fitness', 'Sports coaching'],
  local: ['Event planning', 'Interior styling', 'Home organising', 'Pet care', 'Gardening'],
};

// ─── Indian names ──────────────────────────────────────────────────────────

const firstNames = [
  'Aarav', 'Priya', 'Arjun', 'Ananya', 'Rohan', 'Sneha', 'Karan', 'Ishika', 'Vikram', 'Neha',
  'Rahul', 'Pooja', 'Aditya', 'Shreya', 'Amit', 'Kavya', 'Siddharth', 'Riya', 'Deepak', 'Meera',
  'Rajesh', 'Pallavi', 'Nikhil', 'Divya', 'Suresh', 'Anjali', 'Manish', 'Sakshi', 'Vivek', 'Tanvi',
  'Gaurav', 'Nikita', 'Harsh', 'Simran', 'Akash', 'Komal', 'Kunal', 'Swati', 'Varun', 'Ritika',
  'Ankit', 'Bhavna', 'Dhruv', 'Garima', 'Hemant', 'Jyoti', 'Mohit', 'Nidhi', 'Piyush', 'Rashmi',
];
const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Rao', 'Reddy', 'Nair',
  'Mehta', 'Shah', 'Desai', 'Iyer', 'Bhat', 'Mishra', 'Pandey', 'Tiwari', 'Chauhan', 'Yadav',
  'Agarwal', 'Saxena', 'Kapoor', 'Malhotra', 'Bansal', 'Soni', 'Thakur', 'Chaudhary', 'Arora', 'Khanna',
];

const headlines = {
  food: ['Weekend baker with a passion for sourdough', 'Home chef — South Indian & Continental', 'Tiffin service for healthy office meals'],
  fashion: ['Fashion designer — bridal & ethnic wear', 'Personal stylist for corporate professionals', 'Handmade jewellery artisan'],
  creative: ['Wedding & product photographer', 'Guitar teacher — 10 years experience', 'Mehendi artist for all occasions'],
  tech: ['Full-stack developer — React & Node', 'UI/UX designer — 5 years in SaaS', 'Social media manager — grew 50K+ accounts'],
  education: ['Math tutor — Class 8-12, IIT aspirants', 'IELTS trainer with 8.5 band score', 'Career counsellor — placed 200+ students'],
  finance: ['CA — GST, ITR & startup compliance', 'Financial planner — mutual funds & insurance', 'Bookkeeper for small businesses'],
  fitness: ['Certified yoga instructor — morning batches', 'Personal trainer — home & gym sessions', 'Zumba instructor — weekend batches'],
  local: ['Event planner — birthdays to weddings', 'Interior design consultant — budget-friendly', 'Professional home organiser'],
};

const opportunityTitles = {
  food: ['Weekend Baker Needed — Cloud Kitchen', 'Tiffin Service Partner — Office Area', 'Street Food Stall — Evening Shift', 'Catering Help for Wedding', 'Meal Prep Assistant — Healthy Meals'],
  fashion: ['Boutique Sales Assistant — Weekend', 'Tailoring Help — Festive Season Rush', 'Jewellery Making Workshop Assistant', 'Fashion Shoot Coordinator', 'Saree Draping Expert for Events'],
  creative: ['Product Photographer — E-commerce Shoots', 'Music Teacher for Kids — Weekend', 'Art Workshop Assistant', 'Mehendi Artist — Wedding Season', 'Graphic Designer — Social Media'],
  tech: ['React Developer — Part-time Project', 'UI/UX Design for Mobile App', 'Social Media Manager — D2C Brand', 'SEO Consultant — Monthly Retainer', 'Content Writer — Tech Blog'],
  education: ['Math Tutor — Class 10-12', 'English Teacher — Spoken English Batch', 'Career Counsellor — College Students', 'Coding Workshop for Kids', 'JEE/NEET Coaching Support'],
  finance: ['GST Filing — Small Business', 'Bookkeeping — Startup', 'Tax Planning — Salaried Professionals', 'Insurance Advisory — Group Session', 'Legal Documentation — Company Setup'],
  fitness: ['Yoga Instructor — Morning Batch', 'Personal Trainer — Home Visits', 'Zumba Instructor — Weekend Batch', 'Nutrition Planning — Athletes', 'Sports Coach — Cricket Academy'],
  local: ['Event Coordinator — Corporate', 'Interior Consultation — New Home', 'Garden Designer — Weekend Project', 'Pet Sitter — Weekend', 'Home Organiser — Full House Declutter'],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function pickN<T>(arr: T[], n: number): T[] { const shuffled = [...arr].sort(() => Math.random() - 0.5); return shuffled.slice(0, n); }
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

export async function seedSideKaamMarketplaceData(prisma: PrismaClient, orgId: string) {
  console.log('  📦 Seeding marketplace data for SideKaam...');

  // ─── Create End Users (50) ────────────────────────────────────────────
  const endUsers: any[] = [];
  for (let i = 0; i < 50; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${rand(1, 99)}@gmail.com`;
    const phone = `+91${rand(7000000000, 9999999999)}`;

    const user = await prisma.endUser.upsert({
      where: { orgId_email: { orgId, email } },
      create: { orgId, name: `${first} ${last}`, email, phone },
      update: {},
    });
    endUsers.push(user);
  }
  console.log(`    ✅ ${endUsers.length} end users created`);

  // ─── Create Marketplace Profiles (40 — mix of experiencers & providers) ─
  const profiles: any[] = [];
  for (let i = 0; i < 40; i++) {
    const user = endUsers[i];
    const isProvider = i < 15; // First 15 are providers, rest are experiencers
    const userType = isProvider ? 'provider' : 'experiencer';
    const cat = pick(categories);
    const city = pick(cities);
    const rate = isProvider ? rand(300, 1500) : rand(200, 2000);

    const profile = await prisma.marketplaceProfile.upsert({
      where: { userId_orgId: { userId: user.id, orgId } },
      create: {
        userId: user.id, orgId, userType,
        categories: pickN(categories, rand(1, 3)),
        subcategories: pickN(subcats[cat] || [], rand(1, 3)),
        city,
        workMode: pick(['online', 'local', 'both']),
        hourlyRateMin: rate,
        hourlyRateMax: rate + rand(100, 500),
        hoursBand: pick(['2-4', '4-8', '8-15', '15+']),
        scheduleSlots: pickN(['morning', 'evening', 'weekends', 'flexible'], rand(1, 3)),
        headline: pick(headlines[cat as keyof typeof headlines] || headlines.tech),
        pitchText: `Hi! I'm ${user.name} from ${city}. I love ${cat} and I'm looking to ${isProvider ? 'offer experiences' : 'try something new'}. Available ${pick(['weekends', 'evenings', 'flexible hours'])}.`,
        trustScore: rand(30, 95),
        avgRating: Math.round(rand(35, 50)) / 10,
        reviewCount: rand(0, 25),
        totalHours: rand(0, 200),
        totalEarned: rand(0, 50000),
        isActive: true,
      },
      update: {},
    });
    profiles.push(profile);
  }
  console.log(`    ✅ ${profiles.length} marketplace profiles created`);

  // ─── Create Opportunities (30 — from providers) ──────────────────────
  const providerProfiles = profiles.filter((p) => p.userType === 'provider');
  const opportunities: any[] = [];
  for (let i = 0; i < 30; i++) {
    const provider = pick(providerProfiles);
    const cat = pick(provider.categories as string[]);
    const city = provider.city as string;
    const titles = opportunityTitles[cat as keyof typeof opportunityTitles] || opportunityTitles.tech;

    const opp = await prisma.opportunity.create({
      data: {
        providerId: provider.id, orgId,
        title: pick(titles),
        description: `Looking for someone enthusiastic to join us in ${city}. Great learning opportunity with hands-on experience. ${pick(['Flexible timings.', 'Weekends preferred.', 'Evening slots available.', 'Come with an open mind!'])}`,
        category: cat,
        subcategory: pick(subcats[cat as keyof typeof subcats] || subcats['tech']!),
        city,
        workMode: pick(['online', 'local', 'both']),
        hoursNeeded: rand(1, 8),
        hourlyBudget: rand(300, 2000),
        scheduledDate: `2026-04-${String(rand(5, 30)).padStart(2, '0')}`,
        scheduledTime: pick(['09:00', '10:00', '14:00', '16:00', '18:00']),
        isRecurring: Math.random() > 0.6,
        status: 'active',
        applicants: rand(0, 15),
      },
    });
    opportunities.push(opp);
  }
  console.log(`    ✅ ${opportunities.length} opportunities created`);

  // ─── Create Bookings (20) ────────────────────────────────────────────
  const experiencerProfiles = profiles.filter((p) => p.userType === 'experiencer');
  const bookings: any[] = [];
  for (let i = 0; i < 20; i++) {
    const opp = pick(opportunities);
    const experiencer = pick(experiencerProfiles);
    const hours = rand(1, 4);
    const status = pick(['pending', 'confirmed', 'completed', 'completed', 'completed']);

    const booking = await prisma.marketplaceBooking.create({
      data: {
        experiencerId: experiencer.id,
        providerId: opp.providerId,
        experienceId: opp.id,
        orgId,
        date: `2026-04-${String(rand(5, 28)).padStart(2, '0')}`,
        startTime: pick(['09:00', '10:00', '14:00', '16:00']),
        durationHours: hours,
        hourlyRate: opp.hourlyBudget,
        totalAmount: opp.hourlyBudget * hours,
        message: pick([
          'Really excited to try this!',
          'I\'ve always wanted to experience this.',
          'Looking forward to learning something new.',
          'This sounds amazing, count me in!',
          'Available this weekend, let\'s do it!',
        ]),
        status,
      },
    });
    bookings.push(booking);
  }
  console.log(`    ✅ ${bookings.length} bookings created`);

  // ─── Create Reviews (for completed bookings) ─────────────────────────
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  let reviewCount = 0;
  for (const booking of completedBookings) {
    const rating = rand(3, 5);
    const reviews = [
      'Amazing experience! Learned so much in just a few hours.',
      'Really professional and welcoming. Would recommend to anyone.',
      'Great learning opportunity. The host was super patient.',
      'Loved every minute of it. Will definitely come back!',
      'Good experience overall. The work was interesting.',
      'Fantastic! Exactly what I was looking for.',
      'Wonderful host and great environment to learn.',
    ];

    await prisma.marketplaceReview.create({
      data: {
        bookingId: booking.id,
        reviewerId: booking.experiencerId,
        revieweeId: booking.providerId,
        orgId,
        rating,
        text: pick(reviews),
      },
    });
    reviewCount++;
  }
  console.log(`    ✅ ${reviewCount} reviews created`);

  // ─── Create Onboarding Records (for all users) ───────────────────────
  for (const profile of profiles) {
    await prisma.marketplaceOnboarding.upsert({
      where: { userId_orgId: { userId: profile.userId, orgId } },
      create: {
        userId: profile.userId, orgId,
        userType: profile.userType,
        categories: profile.categories,
        subcategories: profile.subcategories,
        city: profile.city,
        workMode: profile.workMode,
        hourlyRateBand: profile.hourlyRateMin > 1000 ? '1000-2000' : profile.hourlyRateMin > 500 ? '500-1000' : '300-500',
        hoursBand: profile.hoursBand,
        scheduleSlots: profile.scheduleSlots,
        onboardingStep: 30, // completed
      },
      update: {},
    });
  }
  console.log(`    ✅ ${profiles.length} onboarding records created`);

  // ─── Create App Subscriptions (30 active) ─────────────────────────────
  const planOptions = ['monthly', 'half-yearly', 'yearly'] as const;
  const planPrices = { monthly: 499, 'half-yearly': 2499, yearly: 4499 } as const;
  let subCount = 0;
  for (let i = 0; i < 30; i++) {
    const user = endUsers[i];
    const plan = pick([...planOptions]);
    const amount = planPrices[plan as keyof typeof planPrices] ?? 499;
    const gst = Math.round(amount * 0.18);

    await prisma.appSubscription.create({
      data: {
        userId: user.id, orgId,
        plan,
        amount, gst, total: amount + gst,
        status: 'active',
        activatedAt: new Date(Date.now() - rand(1, 60) * 86400000),
        expiresAt: new Date(Date.now() + rand(30, 365) * 86400000),
      },
    });
    subCount++;
  }
  console.log(`    ✅ ${subCount} subscriptions created`);

  console.log('  🎉 SideKaam marketplace data seeded successfully!');
}
