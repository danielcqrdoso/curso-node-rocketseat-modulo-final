import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { LocationParams } from '@/core/repositories/location-params'
import { Utils } from '../utils/use-case-utils'

interface ChangeUserLocationUseCaseRequest {
  id: string
  adminId?: string
  location: LocationParams
}

type ChangeUserLocationUseCaseResponse = Either<NotFoundError, User>

@Injectable()
export class ChangeUserLocationUseCase {
  constructor(
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: ChangeUserLocationUseCaseRequest,
  ): Promise<ChangeUserLocationUseCaseResponse> {
    const user = await this.usersRepository.findById(params.id)

    if (!user) {
      return left(new NotFoundError('User'))
    }

    if (user.role === UserRole.DELIVERYMAN) {
      const admin = await Utils.validateAdmin({
        usersRepository: this.usersRepository,
        adminId: params.adminId,
        deliveryPerson: user,
      })
      if (admin instanceof Error) {
        return left(admin)
      }
    }

    const newUser = await this.usersRepository.update(params.id, {
      latitude: params.location.latitude,
      longitude: params.location.longitude,
    })

    return right(newUser)
  }
}
