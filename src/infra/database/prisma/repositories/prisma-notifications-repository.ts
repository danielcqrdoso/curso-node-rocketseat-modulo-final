import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaNotificationMapper } from '../mappers/prisma-notification-mapper'
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { FilterNotificationParams } from '@/core/repositories/filter-notification'
import { createFilterRaw } from '@/core/utilis/filter-query'
import { listEntitiesfunc } from './utils/listEntitiesFunc'

@Injectable()
export class PrismaNotificationsRepository implements NotificationsRepository {
  // eslint-disable-next-line prettier/prettier
  constructor(private prisma: PrismaService) { }

  async listNotifications(
    params: FilterNotificationParams & PaginationParams,
  ): Promise<FindManyResponse<Notification>> {
    const filterWhere = createFilterRaw([
      params.email ? `'${params.email}' = ANY(emails)` : 'nothing',
      params.title ? `title = '${params.title}'` : 'nothing',
      `"adminId" = '${params.adminId}'`,
    ])

    return listEntitiesfunc<Notification>({
      page: params.page,
      limit: params.limit,
      table: 'notifications',
      filterRaw: filterWhere,
      mapperFunc: PrismaNotificationMapper.toDomain,
      prisma: new PrismaService(),
    })
  }

  async create(notification: Notification): Promise<void> {
    const data = PrismaNotificationMapper.toPrisma(notification)

    await this.prisma.notification.create({
      data,
    })
  }
}
