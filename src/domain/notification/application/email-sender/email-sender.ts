import { Notification } from '@/domain/notification/enterprise/entities/notification'

export interface SendNotificationUseCaseRequest {
  emails: string[]
  title: string
  content: string
  adminId?: string
}

export abstract class EmailSender {
  abstract send(params: SendNotificationUseCaseRequest): Promise<Notification>
}
