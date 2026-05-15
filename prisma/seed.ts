import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { tier: 'FREE' },
    update: {},
    create: {
      tier: 'FREE',
      name: 'Free',
      nameRu: 'Бесплатный',
      description: '1 ward, 2 emergency contacts, 50 AI messages/month',
      descriptionRu: '1 подопечный, 2 контакта, 50 AI-сообщений/месяц',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'usd',
      maxWards: 1,
      maxContacts: 2,
      aiMessagesMonth: 50,
      features: ['checkin', 'medication', 'emergency_card'],
    },
  });

  await prisma.plan.upsert({
    where: { tier: 'FAMILY' },
    update: {},
    create: {
      tier: 'FAMILY',
      name: 'Family',
      nameRu: 'Семейный',
      description: '3 wards, unlimited contacts, 500 AI messages/month, all features',
      descriptionRu: '3 подопечных, безлимит контактов, 500 AI-сообщений/месяц, все функции',
      priceMonthly: 999,
      priceYearly: 9990,
      currency: 'usd',
      maxWards: 3,
      maxContacts: -1,
      aiMessagesMonth: 500,
      features: [
        'checkin', 'medication', 'emergency_card',
        'fraud_detection', 'wellness', 'walk_safety',
        'appointments', 'companion', 'dashboard',
      ],
    },
  });

  await prisma.plan.upsert({
    where: { tier: 'CARE' },
    update: {},
    create: {
      tier: 'CARE',
      name: 'Care',
      nameRu: 'Забота',
      description: 'Unlimited wards, unlimited everything, priority support, API access',
      descriptionRu: 'Безлимит подопечных, всё безлимитно, приоритетная поддержка, API',
      priceMonthly: 2999,
      priceYearly: 29990,
      currency: 'usd',
      maxWards: -1,
      maxContacts: -1,
      aiMessagesMonth: -1,
      features: [
        'checkin', 'medication', 'emergency_card',
        'fraud_detection', 'wellness', 'walk_safety',
        'appointments', 'companion', 'dashboard',
        'api_access', 'priority_support', 'custom_branding',
      ],
    },
  });

  console.log('Plans seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
