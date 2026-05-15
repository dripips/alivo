import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ── Plans ─────────────────────────────────────────────
  const free = await prisma.plan.upsert({
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

  const family = await prisma.plan.upsert({
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

  const care = await prisma.plan.upsert({
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

  const pw = await bcrypt.hash('demo123', 12);

  // ── ADMIN — SaaS operator ────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alivo.cc' },
    update: {},
    create: {
      email: 'admin@alivo.cc',
      name: 'Alivo Admin',
      password: pw,
      role: 'ADMIN',
      locale: 'en',
      timezone: 'UTC',
    },
  });

  // ── GUARDIAN — Мария (дочь) ───────────────────────────
  const maria = await prisma.user.upsert({
    where: { email: 'maria@demo.com' },
    update: {},
    create: {
      email: 'maria@demo.com',
      name: 'Мария Петрова',
      password: pw,
      role: 'GUARDIAN',
      locale: 'ru',
      timezone: 'Europe/Moscow',
    },
  });

  // ── WARD — Иван Петрович (отец) ──────────────────────
  const ivan = await prisma.user.upsert({
    where: { email: 'ivan@demo.com' },
    update: {},
    create: {
      email: 'ivan@demo.com',
      name: 'Иван Петрович',
      password: pw,
      role: 'WARD',
      locale: 'ru',
      timezone: 'Europe/Moscow',
      birthDate: new Date('1948-03-15'),
    },
  });

  // ── WARD — Elena (EN demo) ───────────────────────────
  const elena = await prisma.user.upsert({
    where: { email: 'elena@demo.com' },
    update: {},
    create: {
      email: 'elena@demo.com',
      name: 'Elena Smith',
      password: pw,
      role: 'WARD',
      locale: 'en',
      timezone: 'America/New_York',
      birthDate: new Date('1952-07-22'),
    },
  });

  // ── Guardian → Ward links ────────────────────────────
  await prisma.guardianWard.upsert({
    where: { guardianId_wardId: { guardianId: maria.id, wardId: ivan.id } },
    update: {},
    create: { guardianId: maria.id, wardId: ivan.id, label: 'Папа' },
  });

  await prisma.guardianWard.upsert({
    where: { guardianId_wardId: { guardianId: maria.id, wardId: elena.id } },
    update: {},
    create: { guardianId: maria.id, wardId: elena.id, label: 'Aunt Elena' },
  });

  // ── Emergency contacts for Ivan ──────────────────────
  await prisma.emergencyContact.create({
    data: {
      userId: ivan.id,
      name: 'Мария (дочь)',
      phone: '+79991234567',
      priority: 0,
    },
  }).catch(() => {});

  await prisma.emergencyContact.create({
    data: {
      userId: ivan.id,
      name: 'Скорая помощь',
      phone: '103',
      priority: 1,
    },
  }).catch(() => {});

  // ── Medical profile for Ivan ─────────────────────────
  await prisma.medicalProfile.upsert({
    where: { userId: ivan.id },
    update: {},
    create: {
      userId: ivan.id,
      conditions: ['diabetes_type2', 'hypertension'],
      allergies: ['penicillin'],
      bloodType: 'II+',
      doctorName: 'Смирнова А.В.',
      doctorPhone: '+79997654321',
      notes: 'Инсулин в холодильнике, 2-й ящик',
    },
  });

  // ── Medications for Ivan ─────────────────────────────
  await prisma.medication.create({
    data: {
      userId: ivan.id,
      name: 'Метформин',
      dosage: '500mg',
      schedule: [
        { time: '08:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
        { time: '20:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      ],
      instructions: 'После еды',
      startDate: new Date('2025-01-01'),
    },
  }).catch(() => {});

  await prisma.medication.create({
    data: {
      userId: ivan.id,
      name: 'Лизиноприл',
      dosage: '10mg',
      schedule: [
        { time: '09:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      ],
      instructions: 'Натощак',
      startDate: new Date('2025-01-01'),
    },
  }).catch(() => {});

  await prisma.medication.create({
    data: {
      userId: ivan.id,
      name: 'Аспирин',
      dosage: '75mg',
      schedule: [
        { time: '08:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
      ],
      instructions: 'После еды',
      startDate: new Date('2025-03-01'),
    },
  }).catch(() => {});

  // ── Check-in schedule for Ivan ───────────────────────
  await prisma.checkInSchedule.upsert({
    where: { userId: ivan.id },
    update: {},
    create: {
      userId: ivan.id,
      times: ['08:00', '14:00', '21:00'],
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    },
  });

  // ── Sample check-ins (last 7 days) ──────────────────
  const moods = [4, 5, 3, 4, 4, 5, 3];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(8, 5, 0, 0);

    await prisma.checkIn.create({
      data: {
        userId: ivan.id,
        scheduledAt: new Date(date.getTime() - 5 * 60000),
        respondedAt: date,
        status: 'RESPONDED',
        mood: moods[6 - i],
        responseText: 'ok',
        channelUsed: 'TELEGRAM',
      },
    }).catch(() => {});
  }

  // ── Sample wellness logs ─────────────────────────────
  const bpData = [
    { h: 135, l: 88, hr: 72, sugar: 6.1 },
    { h: 128, l: 82, hr: 68, sugar: 5.8 },
    { h: 142, l: 90, hr: 75, sugar: 6.5 },
    { h: 130, l: 85, hr: 70, sugar: 5.9 },
    { h: 133, l: 86, hr: 71, sugar: 6.0 },
  ];
  for (let i = 4; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(7, 30, 0, 0);
    const d = bpData[4 - i];

    await prisma.wellnessLog.create({
      data: {
        userId: ivan.id,
        bloodPressureH: d.h,
        bloodPressureL: d.l,
        heartRate: d.hr,
        bloodSugar: d.sugar,
        temperature: 36.6,
        weight: 82.5,
        measuredAt: date,
      },
    }).catch(() => {});
  }

  // ── Sample appointment ───────────────────────────────
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);
  nextWeek.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      userId: ivan.id,
      title: 'Приём у кардиолога',
      location: 'Поликлиника №5, каб. 305',
      doctorName: 'Смирнова А.В.',
      scheduledAt: nextWeek,
      remindBefore: 60,
      notes: 'Взять полис, результаты анализов крови, список лекарств',
    },
  }).catch(() => {});

  // ── Emergency card for Ivan ──────────────────────────
  await prisma.user.update({
    where: { id: ivan.id },
    data: { emergencyCardToken: 'ivan2024demo' },
  });

  // ── Subscriptions ────────────────────────────────────
  const farFuture = new Date('2099-12-31');

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      planId: care.id,
      status: 'ACTIVE',
      currentPeriodEnd: farFuture,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: maria.id },
    update: {},
    create: {
      userId: maria.id,
      planId: family.id,
      status: 'ACTIVE',
      currentPeriodEnd: farFuture,
    },
  });

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              Alivo — Demo Accounts                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  All passwords: demo123                             ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  ADMIN (SaaS)     admin@alivo.cc     Care plan      ║');
  console.log('║  GUARDIAN          maria@demo.com     Family plan    ║');
  console.log('║  WARD (RU)        ivan@demo.com      —              ║');
  console.log('║  WARD (EN)        elena@demo.com     —              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  Ivan has: medical profile, 3 medications,          ║');
  console.log('║  check-in schedule, 7 days of check-ins,            ║');
  console.log('║  5 wellness logs, 1 appointment, emergency card     ║');
  console.log('║  Emergency card: /api/emergency-card/ivan2024demo   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
