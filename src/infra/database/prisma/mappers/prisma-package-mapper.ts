import { Package as PrismaPackage, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { FileType } from '@/core/repositories/photo-params'

export class PrismaPackageMapper {
  static toDomain(raw: PrismaPackage | Pack): Pack {
    return Pack.create(
      {
        productQuantity: raw.productQuantity,
        fileName: raw.fileName ?? undefined,
        fileType: raw.fileType ? (raw.fileType as FileType) : undefined,
        fileBody: raw.fileBody ?? undefined,
        status: raw.status as PackageStatus,
        latitude: raw.latitude,
        longitude: raw.longitude,
        createdAt: raw.createdAt,
        deliveryAt: raw.deliveryAt ?? undefined,
        availablePickupAt: raw.availablePickupAt ?? undefined,
        pickupAt: raw.pickupAt ?? undefined,
        returnedAt: raw.returnedAt ?? undefined,
        deliveryPersonId: raw.deliveryPersonId ?? undefined,
        recipientId: raw.recipientId,
        productId: raw.productId,
        isDeleted: raw.isDeleted,
        deletedAt: raw.deletedAt ?? undefined,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(pack: Pack): Prisma.PackageUncheckedCreateInput {
    return {
      id: pack.id,
      productQuantity: pack.productQuantity,
      fileName: pack.fileName,
      fileType: pack.fileType,
      fileBody: pack.fileBody,
      status: pack.status,
      latitude: pack.latitude,
      longitude: pack.longitude,
      createdAt: pack.createdAt,
      deliveryAt: pack.deliveryAt,
      availablePickupAt: pack.availablePickupAt,
      pickupAt: pack.pickupAt,
      returnedAt: pack.returnedAt,
      deliveryPersonId: pack.deliveryPersonId,
      recipientId: pack.recipientId,
      productId: pack.productId,
      deletedAt: pack.deletedAt,
      isDeleted: pack.isDeleted,
    }
  }
}
