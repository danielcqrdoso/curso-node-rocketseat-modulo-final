import { Product } from '@/domain/delivery/enterprise/entities/product'
import { ProductsRepository } from '@/domain/delivery/application/repositories/products-repository'
import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'

interface CreateProductUseCaseRequest {
  name: string
  description: string
  longitude: number
  latitude: number
}

type CreateProductUseCaseResponse = Either<
  null,
  {
    product: Product
  }
>

@Injectable()
export class CreateProductUseCase {
  constructor(
    private productsRepository: ProductsRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: CreateProductUseCaseRequest,
  ): Promise<CreateProductUseCaseResponse> {
    const product = Product.create({
      ...params,
    })

    await this.productsRepository.create(product)

    return right({
      product,
    })
  }
}
