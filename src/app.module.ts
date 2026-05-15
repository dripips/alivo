import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
  ],
})
export class AppModule {}
