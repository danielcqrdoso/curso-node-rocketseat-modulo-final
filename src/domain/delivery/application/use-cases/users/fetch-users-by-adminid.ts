import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { Utils } from '../utils/use-case-utils'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { User } from '@/domain/delivery/enterprise/entities/user'

interface FetchUsersUseCaseRequest {
  adminId: string
  paginationParams: PaginationParams
}

type FetchUsersUseCaseResponse = Either<
  NotFoundError | ParamsNotProvidedError,
  FindManyResponse<User>
>

@Injectable()
export class FetchUsersUseCase {
  constructor(
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: FetchUsersUseCaseRequest,
  ): Promise<FetchUsersUseCaseResponse> {
    const admin = await Utils.findAdmin(this.usersRepository, params.adminId)

    if (admin instanceof Error) {
      return left(admin)
    }

    return right(
      await this.usersRepository.listByAdminId(
        params.adminId,
        params.paginationParams,
      ),
    )
  }
}
