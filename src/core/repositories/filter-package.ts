import { PackageStatus } from '@/domain/delivery/enterprise/entities/package'
import { LocationParams } from './location-params'

export interface FilterPackageParams {
  location?: LocationParams
  status?: PackageStatus
  deliveryPersonId?: string
  recipientId?: string
  isDeleted?: boolean
  fileName?: string
}
