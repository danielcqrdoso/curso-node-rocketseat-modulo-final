import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'
import { Encrypter } from '../../cryptography/encrypter'
import { UsersRepository } from '../../repositories/users-repository'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { PackagesRepository } from '../../repositories/packages-repository'
import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'

export class Utils {
  static async createJWTToken(
    encrypter: Encrypter,
    user: User,
  ): Promise<string> {
    return await encrypter.encrypt({
      sub: user.id,
      role: user.role,
    })
  }

  static async findAdmin(
    usersRepository: UsersRepository,
    adminId?: string,
  ): Promise<User | ParamsNotProvidedError | NotFoundError> {
    if (!adminId) {
      return new ParamsNotProvidedError('adminId')
    }

    const admin = await usersRepository.findById(adminId)
    if (!admin || admin.role !== UserRole.ADMIN) {
      return new NotFoundError('admin')
    }

    return admin
  }

  static async validateAdmin(params: {
    usersRepository: UsersRepository
    adminId?: string
    deliveryPerson?: User | null
    deliveryPersonId?: string
  }): Promise<User | ParamsNotProvidedError | NotFoundError | NotAllowedError> {
    const admin = await this.findAdmin(params.usersRepository, params.adminId)
    if (admin instanceof Error) {
      return admin
    }

    if (params.deliveryPersonId) {
      params.deliveryPerson = await params.usersRepository.findById(
        params.deliveryPersonId,
      )
    }

    if (
      !params.deliveryPerson ||
      !params.deliveryPerson.adminId ||
      params.deliveryPerson.adminId !== params.adminId
    ) {
      return new NotAllowedError()
    }

    return admin
  }

  static async validatePackage(params: {
    packagesRepository: PackagesRepository
    packageId: string
    requireStatus: PackageStatus[]
    recipientId?: string
    deliveryPersonId?: string
  }): Promise<Pack | NotFoundError | NotAllowedError> {
    const pack = await params.packagesRepository.findById(params.packageId)

    if (!pack || pack.isDeleted) {
      return new NotFoundError('Package')
    }

    if (
      !params.requireStatus.includes(pack.status) ||
      (params.recipientId && pack.recipientId !== params.recipientId) ||
      (params.deliveryPersonId &&
        pack.deliveryPersonId !== params.deliveryPersonId)
    ) {
      return new NotAllowedError()
    }

    return pack
  }
}
