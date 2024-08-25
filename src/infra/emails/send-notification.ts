import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'
import { Injectable } from '@nestjs/common'
import { createTransport } from 'nodemailer'
import { envSchema } from '@/infra/env/env'
import { config } from 'dotenv'
import {
  EmailSender,
  SendNotificationUseCaseRequest,
} from '@/domain/notification/application/email-sender/email-sender'

config({ path: '.env', override: true })

const env = envSchema.parse(process.env)

@Injectable()
export class SendNotification implements EmailSender {
  constructor(
    private notificationsRepository: NotificationsRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async send(params: SendNotificationUseCaseRequest): Promise<Notification> {
    const transporter = createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: true,
      auth: {
        user: env.EMAIL,
        pass: env.PASSWORD,
      },
    })

    const mailOptionsArray = params.emails.map((email) => ({
      from: env.EMAIL,
      to: email,
      subject: params.title,
      text: params.content,
    }))

    try {
      await Promise.all(
        mailOptionsArray.map((mailOptions) =>
          transporter.sendMail(mailOptions),
        ),
      )
    } catch (error) {
      console.log(error)
    }

    const notification = Notification.create({
      emails: params.emails,
      title: params.title,
      content: params.content,
      adminId: params.adminId,
    })

    await this.notificationsRepository.create(notification)

    return notification
  }
}
