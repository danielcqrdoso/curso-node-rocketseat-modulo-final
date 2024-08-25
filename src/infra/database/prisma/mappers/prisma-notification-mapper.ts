import { Notification as PrismaNotification, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

export class PrismaNotificationMapper {
  static toDomain(raw: PrismaNotification | Notification): Notification {
    return Notification.create(
      {
        title: raw.title,
        content: raw.content,
        emails: raw.emails,
        createdAt: raw.createdAt,
        adminId: raw.adminId ?? undefined,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    notification: Notification,
  ): Prisma.NotificationUncheckedCreateInput {
    return {
      id: notification.id,
      emails: notification.emails,
      title: notification.title,
      content: notification.content,
      createdAt: notification.createdAt,
      adminId: notification.adminId,
    }
  }
}
