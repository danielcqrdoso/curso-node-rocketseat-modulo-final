import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { Pack } from '@/domain/delivery/enterprise/entities/package'
import { PrismaPackageMapper } from '../mappers/prisma-package-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { PhotoParams } from '@/core/repositories/photo-params'
import { FilterPackageParams } from '@/core/repositories/filter-package'
import { LocationParams } from '@/core/repositories/location-params'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { createFilterRaw } from '@/core/utilis/filter-query'
import { listEntitiesfunc } from './utils/listEntitiesFunc'

@Injectable()
export class PrismaPackagesRepository implements PackagesRepository {
  // eslint-disable-next-line prettier/prettier
  constructor(private prisma: PrismaService) { }

  async create(pack: Pack): Promise<void> {
    const data = PrismaPackageMapper.toPrisma(pack)

    await this.prisma.package.create({
      data,
    })
  }

  async findById(id: string): Promise<Pack | null> {
    const pack = await this.prisma.package.findUnique({
      where: {
        id,
      },
    })

    if (!pack) {
      return null
    }

    return PrismaPackageMapper.toDomain(pack)
  }

  async listPackages(
    params: PaginationParams & FilterPackageParams,
  ): Promise<FindManyResponse<Pack>> {
    const filterWhere = createFilterRaw([
      params.status ? `status = '${params.status}'` : 'nothing',
      params.deliveryPersonId
        ? `"deliveryPersonId" = '${params.deliveryPersonId}'`
        : 'nothing',
      params.recipientId
        ? `"recipientId" = '${params.recipientId}'`
        : 'nothing',
      params.isDeleted !== undefined
        ? `"isDeleted" = '${params.isDeleted}'`
        : 'nothing',
      params.fileName ? `"fileName" = '${params.fileName}'` : 'nothing',
    ])

    const selectRaw =
      params.location?.latitude && params.location?.longitude
        ? `*, ( 6371 * acos( cos( radians(${params.location.latitude}) ) * cos( radians(latitude) ) * cos( radians(longitude) - radians(${params.location.longitude}) ) + sin( radians(${params.location.latitude}) ) * sin( radians(latitude) ) ) ) AS distance`
        : undefined

    return listEntitiesfunc<Pack>({
      page: params.page,
      limit: params.limit,
      table: 'packages',
      selectRaw,
      orderBy: selectRaw ? 'distance' : undefined,
      filterRaw: filterWhere,
      mapperFunc: PrismaPackageMapper.toDomain,
      prisma: new PrismaService(),
    })
  }

  async changeStatusToDelivered(
    id: string,
    deliveryPersonId: string,
    location: LocationParams,
  ): Promise<Pack> {
    const pack = await this.prisma.package.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        status: 'delivered',
        deliveryPersonId,
        deliveryAt: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
      },
    })

    return PrismaPackageMapper.toDomain(pack)
  }

  async changeStatusToAvailablePickup(
    id: string,
    photo: PhotoParams,
    location: LocationParams,
  ): Promise<Pack> {
    const pack = await this.prisma.package.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        status: 'availablePickup',
        fileName: photo.fileName,
        fileBody: photo.fileBody,
        fileType: photo.fileType,
        availablePickupAt: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
      },
    })

    return PrismaPackageMapper.toDomain(pack)
  }

  async changeStatusToPickup(
    id: string,
    photo: PhotoParams,
    location: LocationParams,
  ): Promise<Pack> {
    const pack = await this.prisma.package.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        status: 'pickup',
        fileName: photo.fileName,
        fileBody: photo.fileBody,
        fileType: photo.fileType,
        pickupAt: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
      },
    })

    return PrismaPackageMapper.toDomain(pack)
  }

  async changeStatusToReturned(
    id: string,
    photo: PhotoParams,
    location: LocationParams,
  ): Promise<Pack> {
    const pack = await this.prisma.package.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        status: 'returned',
        returnedAt: new Date(),
        fileName: photo.fileName,
        fileBody: photo.fileBody,
        fileType: photo.fileType,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    })

    return PrismaPackageMapper.toDomain(pack)
  }

  async delete(id: string): Promise<Pack> {
    const pack = await this.prisma.package.update({
      where: {
        id,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    return PrismaPackageMapper.toDomain(pack)
  }
}
