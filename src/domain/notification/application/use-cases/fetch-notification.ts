import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Notification } from '../../enterprise/entities/notification'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { Utils } from '@/domain/delivery/application/use-cases/utils/use-case-utils'
import { NotFoundError } from '@/core/errors/errors/not-found-error'

interface FetchNotificationUseCaseRequest {
  email?: string
  title?: string
  adminId: string
  paginationParams?: PaginationParams
}

type FetchNotificationUseCaseResponse = Either<
  ParamsNotProvidedError | NotFoundError,
  FindManyResponse<Notification>
>

@Injectable()
export class FetchNotificationUseCase {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: FetchNotificationUseCaseRequest,
  ): Promise<FetchNotificationUseCaseResponse> {
    if (!params.email && !params.title) {
      return left(new ParamsNotProvidedError('email or title'))
    }

    const admin = await Utils.findAdmin(this.usersRepository, params.adminId)

    if (admin instanceof Error) {
      return left(admin)
    }

    const notifications = await this.notificationsRepository.listNotifications({
      ...params,
    })

    return right(notifications)
  }
}
