import { PaginationParams } from '@/core/repositories/pagination-params'
import { Product } from '../../enterprise/entities/product'
import { FindManyResponse } from '@/core/repositories/find-many-response'

export abstract class ProductsRepository {
  abstract create(product: Product): Promise<void>
  abstract findById(id: string): Promise<Product | null>
  abstract listByName(
    name: string,
    paginationParams: PaginationParams,
  ): Promise<FindManyResponse<Product>>

  abstract delete(id: string): Promise<void>
}
