import { PaginationParams } from '@/core/repositories/pagination-params'
import { Notification } from '../../enterprise/entities/notification'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { FilterNotificationParams } from '@/core/repositories/filter-notification'

export abstract class NotificationsRepository {
  abstract listNotifications(
    params: FilterNotificationParams & PaginationParams,
  ): Promise<FindManyResponse<Notification>>

  abstract create(notification: Notification): Promise<void>
}
