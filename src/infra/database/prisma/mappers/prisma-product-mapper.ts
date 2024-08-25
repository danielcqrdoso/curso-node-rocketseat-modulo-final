import { Product as PrismaProduct, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Product } from '@/domain/delivery/enterprise/entities/product'

export class PrismaProductMapper {
  static toDomain(raw: PrismaProduct | Product): Product {
    return Product.create(
      {
        name: raw.name,
        description: raw.description,
        longitude: raw.latitude,
        latitude: raw.longitude,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(product: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      latitude: product.latitude,
      longitude: product.longitude,
      createdAt: product.createdAt,
    }
  }
}
