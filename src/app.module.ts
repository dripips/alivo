import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { CompanionModule } from './modules/companion/companion.module';
import { MedicalModule } from './modules/medical/medical.module';
import { FraudDetectionModule } from './modules/fraud-detection/fraud-detection.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SosModule } from './modules/sos/sos.module';
import { EmergencyCardModule } from './modules/emergency-card/emergency-card.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { WellnessModule } from './modules/wellness/wellness.module';
import { WalkSafetyModule } from './modules/walk-safety/walk-safety.module';
import { BillingModule } from './modules/billing/billing.module';
import { LandingModule } from './modules/landing/landing.module';
import { AdminModule } from './modules/admin/admin.module';
import { PushModule } from './modules/push/push.module';
import { EmailModule } from './modules/email/email.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
    ]),

    I18nModule.forRoot({
      fallbackLanguage: 'ru',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    ChannelsModule,
    CheckInModule,
    CompanionModule,
    MedicalModule,
    FraudDetectionModule,
    EscalationModule,
    DashboardModule,
    SosModule,
    EmergencyCardModule,
    AppointmentsModule,
    WellnessModule,
    WalkSafetyModule,
    BillingModule,
    LandingModule,
    AdminModule,
    PushModule,
    EmailModule,
    WebhookModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
