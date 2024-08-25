/* eslint-disable prettier/prettier */
// The prettier was disable because it was causing some bugs
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Pack } from '@/domain/delivery/enterprise/entities/package'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { FilterPackageParams } from '@/core/repositories/filter-package'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { Utils } from '../utils/use-case-utils'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { User } from '@/domain/delivery/enterprise/entities/user'

interface FetchPackageUseCaseRequest {
  id?: string
  adminId?: string
  filters?: FilterPackageParams
  paginationParams?: PaginationParams
}

type FetchPackageUseCaseResponse = Either<
  NotFoundError | NotAllowedError,
  FindManyResponse<Pack>
>

@Injectable()
export class FetchPackageUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private packagesRepository: PackagesRepository,
  ) { }

  async execute(
    params: FetchPackageUseCaseRequest,
  ): Promise<FetchPackageUseCaseResponse> {
    const isAdminValid = params.adminId
      ? (await Utils.validateAdmin({
        usersRepository: this.usersRepository,
        adminId: params.adminId,
        deliveryPersonId: params.filters?.deliveryPersonId,
      })) instanceof User
      : true

    if (
      (!params.filters?.deliveryPersonId && !params.filters?.recipientId
      ) || !isAdminValid
    ) {
      return left(new NotAllowedError())
    }

    if (params.id) {
      const pack = await this.packagesRepository.findById(params.id)
      if (!pack) {
        return left(new NotFoundError('Package'))
      }

      if (
        pack.recipientId === params.filters?.recipientId ||
        (pack.deliveryPersonId === params.filters?.deliveryPersonId && pack.deliveryPersonId)) {
        return right({
          entities: [pack],
          newPage: 1,
        })
      }
      return left(new NotAllowedError())
    }

    const packages = await this.packagesRepository.listPackages({
      ...params.filters,
      ...params.paginationParams,
    })

    return right({
      entities: packages.entities,
      newPage: packages.newPage,
    })
  }
}
