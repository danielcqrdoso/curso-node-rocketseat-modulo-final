import { Module } from '@nestjs/common'

import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'

import { SendNotification } from './send-notification'
import { DatabaseModule } from '../database/database.module'
import { PrismaNotificationsRepository } from '../database/prisma/repositories/prisma-notifications-repository'

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaNotificationsRepository,
    { provide: EmailSender, useClass: SendNotification },
  ],
  exports: [EmailSender],
})
// eslint-disable-next-line prettier/prettier
export class EmailModule { }
