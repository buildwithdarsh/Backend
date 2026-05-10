import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service.js';

// ─── Data pools ────────────────────────────────────────────────────────────

const CITIES = [
  'Delhi', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Jaipur', 'Chennai',
  'Kolkata', 'Ahmedabad', 'Indore', 'Lucknow', 'Chandigarh', 'Noida',
  'Gurgaon', 'Bhopal', 'Varanasi', 'Shimla', 'Agra', 'Jhansi', 'Gwalior',
];

const CATEGORIES = ['food', 'fashion', 'creative', 'tech', 'education', 'finance', 'fitness', 'local'];

const SUBCATS: Record<string, string[]> = {
  food: ['Bakery / Cafe', 'Cloud kitchen', 'Tiffin service', 'Street food stall', 'Catering', 'Meal prep', 'Coffee / Chai stall', 'Sweet shop'],
  fashion: ['Boutique / Store', 'Tailoring', 'Jewellery making', 'Styling session', 'Reselling', 'Visual merchandising'],
  creative: ['Photography', 'Music session', 'Painting / Art', 'Mehendi art', 'Graphic design', 'Video production', 'Dance class', 'Pottery / Crafts'],
  tech: ['Web development', 'App building', 'UI/UX design', 'Social media', 'SEO / Marketing', 'Content writing', 'YouTube / Video editing'],
  education: ['School tuition', 'Exam coaching', 'Language teaching', 'Skill workshop', 'Career mentoring', 'Kids activities'],
  finance: ['GST / Tax filing', 'Bookkeeping', 'Financial planning', 'Insurance advisory', 'Legal documentation'],
  fitness: ['Yoga session', 'Personal training', 'Nutrition plan', 'Zumba / Dance fitness', 'Sports coaching', 'Meditation'],
  local: ['Event planning', 'Interior styling', 'Home organising', 'Pet care', 'Gardening', 'Astrology / Vastu'],
};

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Arjun', 'Ananya', 'Rohan', 'Sneha', 'Karan', 'Ishika', 'Vikram', 'Neha',
  'Rahul', 'Pooja', 'Aditya', 'Shreya', 'Amit', 'Kavya', 'Siddharth', 'Riya', 'Deepak', 'Meera',
  'Rajesh', 'Pallavi', 'Nikhil', 'Divya', 'Suresh', 'Anjali', 'Manish', 'Sakshi', 'Vivek', 'Tanvi',
  'Gaurav', 'Nikita', 'Harsh', 'Simran', 'Akash', 'Komal', 'Kunal', 'Swati', 'Varun', 'Ritika',
  'Ankit', 'Bhavna', 'Dhruv', 'Garima', 'Hemant', 'Jyoti', 'Mohit', 'Nidhi', 'Piyush', 'Rashmi',
  'Tarun', 'Uma', 'Yash', 'Zara', 'Omkar', 'Lavanya', 'Pranav', 'Kritika', 'Abhi', 'Sanya',
  'Tushar', 'Isha', 'Sahil', 'Tanya', 'Ravi', 'Megha', 'Ajay', 'Sonali', 'Dev', 'Neelam',
  'Mayank', 'Kirti', 'Shivam', 'Aditi', 'Aman', 'Payal', 'Rishabh', 'Shruti', 'Neeraj', 'Vandana',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Rao', 'Reddy', 'Nair',
  'Mehta', 'Shah', 'Desai', 'Iyer', 'Bhat', 'Mishra', 'Pandey', 'Tiwari', 'Chauhan', 'Yadav',
  'Agarwal', 'Saxena', 'Kapoor', 'Malhotra', 'Bansal', 'Soni', 'Thakur', 'Chaudhary', 'Arora', 'Khanna',
  'Sethi', 'Nagpal', 'Bhatia', 'Vyas', 'Dubey', 'Pillai', 'Menon', 'Das', 'Chatterjee', 'Mukherjee',
];

// Real-sounding business/store names per category
const STORE_NAMES: Record<string, string[]> = {
  food: [
    'Annapurna Kitchen', 'Spice Route Cafe', 'Desi Bites Cloud Kitchen', 'Roti & Rice Tiffins',
    'Chai Sutta Bar', 'The Rolling Pin Bakery', 'Mumbai Dabba Express', 'Saffron Spoon Catering',
    'Naan Stop Kitchen', 'The Hungry Owl', 'Paratha Point', 'Green Bowl Meals',
    'Amma\'s Kitchen', 'Biryani Blues', 'Tandoori Nights', 'Street Masala Co.',
    'Khichdi Express', 'The Curry House', 'Fresh Plate Meals', 'Chaat Chowk',
  ],
  fashion: [
    'Silkroad Boutique', 'Thread & Needle Studio', 'Jharokha Ethnic Wear', 'The Styling Lounge',
    'Rangoli Fashion House', 'Bindi & Bangles', 'Urban Drape Co.', 'Vogue Villa Boutique',
    'Sitara Collections', 'The Fabric Story', 'Mehndi Couture', 'Drape Dreams Studio',
  ],
  creative: [
    'Pixel Perfect Studio', 'Raag Academy of Music', 'Canvas & Color Workshop', 'Shutter Stories Photography',
    'Mudra Dance Academy', 'Inkwell Design Studio', 'Click & Frame', 'ArtVibe Workshop',
    'Reel Craft Productions', 'Chisel & Clay Pottery', 'Lens Lab', 'Creative Canopy Studio',
  ],
  tech: [
    'CodeCraft Solutions', 'PixelForge Design', 'DigiGrowth Marketing', 'WebWiz Studio',
    'AppVenture Labs', 'BrandBoost Digital', 'TechNest Academy', 'DataDriven Co.',
    'CloudPeak Dev Studio', 'SEO Mantra', 'Digital Dukaan', 'ByteSize Solutions',
  ],
  education: [
    'BrainTree Academy', 'MathWiz Coaching', 'WordSmart English Center', 'IQ Academy',
    'Scholar Hub Tuitions', 'Mentor\'s Den', 'EduPrime Learning', 'TopRank Coaching',
    'Bright Minds Academy', 'PrepZone Classes', 'KnowMore Academy', 'Career Compass',
  ],
  finance: [
    'TaxEasy Services', 'FinPlan Advisory', 'LedgerPro Bookkeeping', 'Niti Financial',
    'ComplianceFirst Consulting', 'WealthWise Planning', 'GST Guru Services', 'MoneyMentor',
    'AuditPro Services', 'ClearTax Solutions', 'Arthshastra Finance', 'Capital Bridge Advisory',
  ],
  fitness: [
    'FlexFit Studio', 'Zen Yoga Center', 'PowerHouse Gym', 'BodyCraft Training',
    'Asana Wellness', 'FitZone Academy', 'Iron Temple Gym', 'PranayamLife Studio',
    'Rush Fitness', 'Sweat Factory', 'Core Strength Studio', 'Vitality Hub',
  ],
  local: [
    'Eventify Planners', 'HomeStyle Interiors', 'GreenThumb Gardens', 'PawCare Pet Services',
    'Sparkle Home Organising', 'Festive Touch Events', 'Cozy Nest Interiors', 'Urban Garden Co.',
    'CelebrationCraft', 'NeatSpace Solutions', 'PetPal Services', 'Vastu Vibes Consulting',
  ],
};

const HEADLINES: Record<string, string[]> = {
  food: [
    'Weekend baker with a passion for sourdough', 'Home chef — South Indian & Continental',
    'Tiffin service for healthy office meals', 'Street food lover turned weekend entrepreneur',
    'Catering specialist — weddings & corporates', 'Cloud kitchen owner — 200+ orders/month',
  ],
  fashion: [
    'Fashion designer — bridal & ethnic wear', 'Personal stylist for corporate professionals',
    'Handmade jewellery artisan', 'Boutique owner — sustainable fashion',
  ],
  creative: [
    'Wedding & product photographer', 'Guitar teacher — 10 years experience',
    'Mehendi artist for all occasions', 'Graphic designer & brand identity specialist',
  ],
  tech: [
    'Full-stack developer — React & Node', 'UI/UX designer — 5 years in SaaS',
    'Social media manager — grew 50K+ accounts', 'SEO consultant — 100+ websites optimized',
  ],
  education: [
    'Math tutor — Class 8-12, IIT aspirants', 'IELTS trainer with 8.5 band score',
    'Career counsellor — placed 200+ students', 'Coding teacher for kids — Scratch & Python',
  ],
  finance: [
    'CA — GST, ITR & startup compliance', 'Financial planner — mutual funds & insurance',
    'Bookkeeper for small businesses', 'Tax consultant — 500+ filings done',
  ],
  fitness: [
    'Certified yoga instructor — morning batches', 'Personal trainer — home & gym sessions',
    'Zumba instructor — weekend batches', 'Sports nutritionist — athletes & gym-goers',
  ],
  local: [
    'Event planner — birthdays to weddings', 'Interior design consultant — budget-friendly',
    'Professional home organiser', 'Pet care specialist — dogs & cats',
  ],
};

const OPP_TITLES: Record<string, string[]> = {
  food: [
    'Weekend Baker Needed — Cloud Kitchen', 'Tiffin Service Partner — Office Area',
    'Street Food Stall — Evening Shift', 'Catering Help for Wedding',
    'Meal Prep Assistant — Healthy Meals', 'Chai Stall Assistant — Morning Shift',
    'Kitchen Helper — Weekend Brunch Cafe', 'Cook for Corporate Lunch Service',
  ],
  fashion: [
    'Boutique Sales Assistant — Weekend', 'Tailoring Help — Festive Season',
    'Jewellery Making Workshop Assistant', 'Fashion Shoot Coordinator',
    'Saree Draping Expert for Events', 'Visual Merchandiser — New Store Setup',
  ],
  creative: [
    'Product Photographer — E-commerce', 'Music Teacher for Kids — Weekend',
    'Art Workshop Assistant', 'Mehendi Artist — Wedding Season',
    'Video Editor — YouTube Channel', 'Dance Instructor — Evening Batch',
  ],
  tech: [
    'React Developer — Part-time Project', 'UI/UX Design for Mobile App',
    'Social Media Manager — D2C Brand', 'SEO Consultant — Monthly Retainer',
    'Content Writer — Tech Blog', 'WordPress Developer — 5 Page Website',
  ],
  education: [
    'Math Tutor — Class 10-12', 'English Teacher — Spoken English Batch',
    'Career Counsellor — College Students', 'Coding Workshop for Kids',
    'JEE/NEET Coaching Support', 'Art & Craft Teacher — Preschool',
  ],
  finance: [
    'GST Filing — Small Business', 'Bookkeeping — Startup',
    'Tax Planning — Salaried Professionals', 'Insurance Advisory — Group Session',
    'Legal Documentation — Company Setup', 'Payroll Setup — 20 Employee Company',
  ],
  fitness: [
    'Yoga Instructor — Morning Batch', 'Personal Trainer — Home Visits',
    'Zumba Instructor — Weekend Batch', 'Nutrition Planning — Athletes',
    'Sports Coach — Cricket Academy', 'Meditation Guide — Corporate Wellness',
  ],
  local: [
    'Event Coordinator — Corporate', 'Interior Consultation — New Home',
    'Garden Designer — Weekend Project', 'Pet Sitter — Weekend',
    'Home Organiser — Full House Declutter', 'Vastu Consultant — New Office',
  ],
};

const BOOKING_MESSAGES = [
  'Really excited to try this!', "I've always wanted to experience this.",
  'Looking forward to learning something new.', 'This sounds amazing, count me in!',
  'Available this weekend, let\'s do it!', 'Can\'t wait to start!',
  'My friend recommended SideKaam, this is perfect.', 'Exactly what I was looking for.',
  'I have some background in this, keen to explore more.', 'Let\'s connect and discuss details!',
];

const REVIEW_TEXTS = [
  'Amazing experience! Learned so much in just a few hours.',
  'Really professional and welcoming. Would recommend to anyone.',
  'Great learning opportunity. The host was super patient.',
  'Loved every minute of it. Will definitely come back!',
  'Good experience overall. The work was interesting.',
  'Fantastic! Exactly what I was looking for.',
  'Wonderful host and great environment to learn.',
  'Life-changing experience. Already booked my next session!',
  'Very well organized. Worth every rupee.',
  'Super friendly team. Felt like I belonged from day one.',
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function futureDate(minDays: number, maxDays: number): string {
  const d = new Date(Date.now() + rand(minDays, maxDays) * 86400000);
  return d.toISOString().split('T')[0]!;
}
function pastDate(minDays: number, maxDays: number): Date {
  return new Date(Date.now() - rand(minDays, maxDays) * 86400000);
}

@Injectable()
export class MarketplaceFakeDataJob {
  private readonly logger = new Logger(MarketplaceFakeDataJob.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  // Every 3 hours
  @Cron('0 */3 * * *')
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Fake data job already running, skipping');
      return;
    }

    this.isRunning = true;
    try {
      // Find SideKaam org
      const org = await this.prisma.organization.findFirst({
        where: { slug: 'sidekaam', deletedAt: null },
        select: { id: true },
      });

      if (!org) {
        this.logger.warn('SideKaam org not found, skipping fake data job');
        return;
      }

      const orgId = org.id;
      let totalProfiles = 0;
      let totalOpportunities = 0;
      let totalBookings = 0;
      let totalReviews = 0;

      for (const city of CITIES) {
        const result = await this.seedCityData(orgId, city);
        totalProfiles += result.profiles;
        totalOpportunities += result.opportunities;
        totalBookings += result.bookings;
        totalReviews += result.reviews;
      }

      this.logger.log(
        `Fake data seeded: ${totalProfiles} profiles, ${totalOpportunities} opportunities, ` +
        `${totalBookings} bookings, ${totalReviews} reviews across ${CITIES.length} cities`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Fake data job error: ${reason}`);
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Per-city seeding ──────────────────────────────────────────────────

  private async seedCityData(orgId: string, city: string) {
    const PROFILES_PER_CITY = 100;
    const usersPerBatch = 20;
    const createdProfiles: any[] = [];
    let opportunityCount = 0;
    let bookingCount = 0;
    let reviewCount = 0;

    // Create users + profiles in batches
    for (let batch = 0; batch < PROFILES_PER_CITY / usersPerBatch; batch++) {
      const users: any[] = [];

      for (let i = 0; i < usersPerBatch; i++) {
        const first = pick(FIRST_NAMES);
        const last = pick(LAST_NAMES);
        const suffix = rand(100, 9999);
        const email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@fake.sidekaam.in`;
        const phone = `+910000${rand(100000, 999999)}`;

        const user = await this.prisma.endUser.upsert({
          where: { orgId_email: { orgId, email } },
          create: {
            orgId,
            name: `${first} ${last}`,
            email,
            phone,
            tags: ['__fake__'],
            isEmailVerified: true,
            isPhoneVerified: true,
            onboardingStep: 4,
          },
          update: {},
        });
        users.push(user);
      }

      // 30% providers, 70% experiencers
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const isProvider = i < Math.floor(usersPerBatch * 0.3);
        const userType = isProvider ? 'provider' : 'experiencer';
        const cats = pickN(CATEGORIES, rand(1, 3));
        const primaryCat = cats[0]!;
        const subs = pickN(SUBCATS[primaryCat] || [], rand(1, 4));
        const rateMin = isProvider ? rand(300, 1500) : rand(200, 2000);
        const storeName = isProvider ? pick(STORE_NAMES[primaryCat] || STORE_NAMES['tech']!) : null;

        const profile = await this.prisma.marketplaceProfile.upsert({
          where: { userId_orgId: { userId: user.id, orgId } },
          create: {
            userId: user.id,
            orgId,
            userType,
            categories: cats,
            subcategories: subs,
            city,
            workMode: pick(['online', 'local', 'both']),
            hourlyRateMin: rateMin,
            hourlyRateMax: rateMin + rand(100, 800),
            hoursBand: pick(['2-4', '4-8', '8-15', '15+']),
            scheduleSlots: pickN(['morning', 'evening', 'weekends', 'flexible'], rand(1, 3)),
            headline: storeName
              ? `${storeName} — ${pick(HEADLINES[primaryCat] || HEADLINES['tech']!)}`
              : pick(HEADLINES[primaryCat] || HEADLINES['tech']!),
            pitchText: this.generatePitch(user.name, city, primaryCat, userType, storeName),
            trustScore: rand(40, 98),
            avgRating: Math.round(rand(35, 50)) / 10,
            reviewCount: rand(2, 40),
            totalHours: rand(10, 500),
            totalEarned: rand(5000, 150000),
            isActive: true,
          },
          update: {},
        });
        createdProfiles.push(profile);
      }
    }

    // ─── Create Opportunities (from providers) ───────────────────────────
    const providerProfiles = createdProfiles.filter((p) => p.userType === 'provider');
    const experiencerProfiles = createdProfiles.filter((p) => p.userType === 'experiencer');
    const opportunities: any[] = [];

    for (const provider of providerProfiles) {
      // Each provider posts 1-3 opportunities
      const oppCount = rand(1, 3);
      for (let j = 0; j < oppCount; j++) {
        const cat = pick(provider.categories as string[]);
        const titles = OPP_TITLES[cat as keyof typeof OPP_TITLES] || OPP_TITLES['tech']!;
        const storeName = pick(STORE_NAMES[cat as keyof typeof STORE_NAMES] || STORE_NAMES['tech']!);

        const opp = await this.prisma.opportunity.create({
          data: {
            providerId: provider.id,
            orgId,
            title: `${pick(titles)} — ${storeName}`,
            description: this.generateOppDescription(city, cat, storeName),
            category: cat,
            subcategory: pick(SUBCATS[cat as keyof typeof SUBCATS] || SUBCATS['tech']!),
            city,
            workMode: pick(['online', 'local', 'both']),
            hoursNeeded: rand(2, 8),
            hourlyBudget: rand(300, 2500),
            scheduledDate: futureDate(1, 30),
            scheduledTime: pick(['08:00', '09:00', '10:00', '14:00', '16:00', '18:00']),
            isRecurring: Math.random() > 0.5,
            status: 'active',
            applicants: rand(3, 25),
          },
        });
        opportunities.push(opp);
        opportunityCount++;
      }
    }

    // ─── Create Bookings (simulate demand/FOMO) ─────────────────────────
    const bookingsToCreate = Math.min(opportunities.length * 2, experiencerProfiles.length);
    const usedExperiencers = new Set<string>();

    for (let i = 0; i < bookingsToCreate; i++) {
      const opp = pick(opportunities);
      // Try to pick a unique experiencer
      let experiencer = pick(experiencerProfiles);
      let attempts = 0;
      while (usedExperiencers.has(`${experiencer.id}-${opp.id}`) && attempts < 5) {
        experiencer = pick(experiencerProfiles);
        attempts++;
      }
      usedExperiencers.add(`${experiencer.id}-${opp.id}`);

      const hours = rand(1, 6);
      const status = pick(['pending', 'confirmed', 'confirmed', 'completed', 'completed', 'completed']);

      const booking = await this.prisma.marketplaceBooking.create({
        data: {
          experiencerId: experiencer.id,
          providerId: opp.providerId,
          experienceId: opp.id,
          orgId,
          date: status === 'completed' ? pastDate(1, 14).toISOString().split('T')[0]! : futureDate(1, 14),
          startTime: pick(['09:00', '10:00', '14:00', '16:00', '18:00']),
          durationHours: hours,
          hourlyRate: opp.hourlyBudget,
          totalAmount: opp.hourlyBudget * hours,
          message: pick(BOOKING_MESSAGES),
          status,
        },
      });
      bookingCount++;

      // Create reviews for completed bookings
      if (status === 'completed' && Math.random() > 0.2) {
        try {
          await this.prisma.marketplaceReview.create({
            data: {
              bookingId: booking.id,
              reviewerId: experiencer.id,
              revieweeId: opp.providerId,
              orgId,
              rating: rand(3, 5),
              text: pick(REVIEW_TEXTS),
            },
          });
          reviewCount++;
        } catch {
          // Skip review if constraint fails
        }
      }
    }

    // ─── Update applicant counts on opportunities ────────────────────────
    for (const opp of opportunities) {
      const actualBookings = await this.prisma.marketplaceBooking.count({
        where: { experienceId: opp.id },
      });
      await this.prisma.opportunity.update({
        where: { id: opp.id },
        data: { applicants: actualBookings + rand(2, 10) }, // Inflate slightly for FOMO
      });
    }

    return {
      profiles: createdProfiles.length,
      opportunities: opportunityCount,
      bookings: bookingCount,
      reviews: reviewCount,
    };
  }

  // ─── Text generators ──────────────────────────────────────────────────

  private generatePitch(name: string, city: string, category: string, userType: string, storeName: string | null): string {
    const intros = [
      `Hi! I'm ${name} from ${city}.`,
      `Hey there — ${name} here, based in ${city}.`,
      `${name} from ${city}, excited to be on SideKaam!`,
    ];

    const providerLines = storeName
      ? [
          `I run ${storeName} and I'm looking for enthusiastic people to join us.`,
          `At ${storeName}, we believe in learning by doing. Come experience ${category} with us!`,
          `${storeName} is hiring part-time through SideKaam. Great environment, real work.`,
        ]
      : [
          `I offer hands-on ${category} experiences for people who want to learn on the ground.`,
          `Looking for motivated people to work with me in ${category}. You'll learn a lot!`,
        ];

    const seekerLines = [
      `I'm looking to try something new in ${category}. Available on weekends mostly.`,
      `Always been curious about ${category}. Ready to dive in and learn!`,
      `Working professional exploring ${category} as a side hustle. Flexible schedule.`,
      `Passionate about ${category} — looking for real-world experience beyond my 9-to-5.`,
    ];

    return `${pick(intros)} ${pick(userType === 'provider' ? providerLines : seekerLines)}`;
  }

  private generateOppDescription(city: string, _category: string, storeName: string): string {
    const openings = [
      `Looking for someone enthusiastic to join ${storeName} in ${city}.`,
      `${storeName} (${city}) is looking for a SideKaam partner.`,
      `Great opportunity at ${storeName}, ${city} — learn and earn!`,
    ];

    const details = [
      'No prior experience needed — we\'ll train you on the job.',
      'Perfect for working professionals looking for a weekend side hustle.',
      'Hands-on work with real customers. Build your portfolio while earning.',
      'Friendly team, flexible hours. Focus on learning and growing.',
      'You\'ll get to work directly with experienced professionals.',
    ];

    const closings = [
      'Apply now — spots fill up fast!',
      'Limited slots available this month.',
      'Join 100+ people who\'ve already experienced this!',
      'Message us to get started. We respond within hours.',
      'Top-rated experience on SideKaam. Don\'t miss out!',
    ];

    return `${pick(openings)} ${pick(details)} ${pick(closings)}`;
  }
}
