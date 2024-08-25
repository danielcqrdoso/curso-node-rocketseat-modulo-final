import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FileType } from '@/core/repositories/photo-params'
import { Optional } from '@/core/types/optional'

export enum PackageStatus {
  RETURNED = 'returned',
  PICKUP = 'pickup',
  AVAILABLE_PICKUP = 'availablePickup',
  DELIVERED = 'delivered',
  WAITING = 'waiting',
}

export interface PackageProps {
  productQuantity: number
  fileName?: string
  fileType?: FileType
  fileBody?: Buffer
  status: PackageStatus
  latitude: number
  longitude: number
  isDeleted: boolean

  deliveryAt?: Date
  availablePickupAt?: Date
  pickupAt?: Date
  returnedAt?: Date
  deletedAt?: Date

  deliveryPersonId?: string
  recipientId: string
  productId: string

  createdAt: Date
  updatedAt?: Date
}

export class Pack extends Entity<PackageProps> {
  get isDeleted() {
    return this.props.isDeleted
  }

  get productQuantity() {
    return this.props.productQuantity
  }

  get fileName() {
    return this.props.fileName
  }

  get fileType() {
    return this.props.fileType
  }

  get fileBody() {
    return this.props.fileBody
  }

  get status() {
    return this.props.status
  }

  get latitude() {
    return this.props.latitude
  }

  get longitude() {
    return this.props.longitude
  }

  get deliveryAt() {
    return this.props.deliveryAt
  }

  get availablePickupAt() {
    return this.props.availablePickupAt
  }

  get pickupAt() {
    return this.props.pickupAt
  }

  get returnedAt() {
    return this.props.returnedAt
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get deliveryPersonId() {
    return this.props.deliveryPersonId
  }

  get recipientId() {
    return this.props.recipientId
  }

  get productId() {
    return this.props.productId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  static create(
    props: Optional<PackageProps, 'createdAt' | 'isDeleted'>,
    id?: UniqueEntityID | null,
  ) {
    // package is an internal word
    const pack = new Pack(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        isDeleted: props.isDeleted ?? false,
      },
      id,
    )

    return pack
  }
}
