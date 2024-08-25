import { PaginationParams } from '@/core/repositories/pagination-params'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '../../repositories/products-repository'
import { FindManyResponse } from '@/core/repositories/find-many-response'
import { Product } from '@/domain/delivery/enterprise/entities/product'
import { Either, right } from '@/core/either'

interface FetchProductUseCaseRequest {
  paginationParams?: PaginationParams
  name: string
}

type FetchProductUseCaseResponse = Either<null, FindManyResponse<Product>>

@Injectable()
export class FetchProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: FetchProductUseCaseRequest,
  ): Promise<FetchProductUseCaseResponse> {
    return right(
      await this.productsRepository.listByName(
        params.name,
        params.paginationParams ?? {},
      ),
    )
  }
}
