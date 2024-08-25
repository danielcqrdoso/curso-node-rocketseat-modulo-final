import { PaginationParams } from '@/core/repositories/pagination-params'
import { FilterPackageParams } from '@/core/repositories/filter-package'
import { Pack } from '@/domain/delivery/enterprise/entities/package'
import { PhotoParams } from '@/core/repositories/photo-params'
import { LocationParams } from '@/core/repositories/location-params'
import { FindManyResponse } from '@/core/repositories/find-many-response'

export abstract class PackagesRepository {
  abstract findById(id: string): Promise<Pack | null>
  abstract listPackages(
    params: PaginationParams & FilterPackageParams,
  ): Promise<FindManyResponse<Pack>>

  abstract changeStatusToDelivered(
    id: string,
    deliveryPersonId: string,
    location: LocationParams,
  ): Promise<Pack>

  abstract changeStatusToAvailablePickup(
    id: string,
    photo: PhotoParams,
    location: LocationParams,
  ): Promise<Pack>

  abstract changeStatusToPickup(
    id: string,
    photo: PhotoParams,
    location: LocationParams,
  ): Promise<Pack>

  abstract changeStatusToReturned(
    id: string,
    photo: PhotoParams,
    location: LocationParams,
  ): Promise<Pack>

  abstract create(pack: Pack): Promise<void>
  abstract delete(id: string): Promise<Pack>
}
