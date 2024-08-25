import { faker } from '@faker-js/faker'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Pack,
  PackageProps,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaPackageMapper } from '@/infra/database/prisma/mappers/prisma-package-mapper'

export function makePack(
  override: Partial<PackageProps> = {},
  id?: UniqueEntityID,
) {
  const pack = Pack.create(
    {
      productQuantity: 1,
      status: PackageStatus.WAITING,
      recipientId: new UniqueEntityID().toString(),
      productId: new UniqueEntityID().toString(),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      isDeleted: false,
      ...override,
    },
    id,
  )

  return pack
}

@Injectable()
export class PackFactory {
  // eslint-disable-next-line prettier/prettier
  constructor(private prisma: PrismaService) { }

  async makePrismaPack(data: Partial<PackageProps> = {}): Promise<Pack> {
    const pack = makePack(data)

    await this.prisma.package.create({
      data: PrismaPackageMapper.toPrisma(pack),
    })

    return pack
  }
}
