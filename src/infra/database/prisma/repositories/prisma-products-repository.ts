import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { ProductsRepository } from '@/domain/delivery/application/repositories/products-repository'
import { Product } from '@/domain/delivery/enterprise/entities/product'
import { PrismaProductMapper } from '../mappers/prisma-product-mapper'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { listEntitiesfunc } from './utils/listEntitiesFunc'
import { FindManyResponse } from '@/core/repositories/find-many-response'

@Injectable()
export class PrismaProductsRepository implements ProductsRepository {
  // eslint-disable-next-line prettier/prettier
  constructor(private prisma: PrismaService) { }

  async create(product: Product): Promise<void> {
    const data = PrismaProductMapper.toPrisma(product)

    await this.prisma.product.create({
      data,
    })
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    })

    if (!product) {
      return null
    }

    return PrismaProductMapper.toDomain(product)
  }

  async listByName(
    name: string,
    paginationParams: PaginationParams,
  ): Promise<FindManyResponse<Product>> {
    return listEntitiesfunc<Product>({
      page: paginationParams.page,
      limit: paginationParams.limit,
      table: 'products',
      selectRaw: '*',
      filterRaw: `name like '%${name}%'`,
      mapperFunc: PrismaProductMapper.toDomain,
      prisma: new PrismaService(),
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: {
        id,
      },
    })
  }
}
