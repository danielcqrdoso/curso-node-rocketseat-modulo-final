import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaProductsRepository } from '@/infra/database/prisma/repositories/prisma-products-repository'
import { FetchProductUseCase } from '../fetch-product'
import { Product } from '@/domain/delivery/enterprise/entities/product'

let productsRepository: PrismaProductsRepository
let sut: FetchProductUseCase

describe('Fetch Product', () => {
  beforeEach(() => {
    productsRepository = new PrismaProductsRepository(new PrismaService())
    sut = new FetchProductUseCase(productsRepository)
  })

  it('should be able to fetch a pack', async () => {
    vi.spyOn(productsRepository, 'listByName').mockResolvedValueOnce({
      entities: [{} as Product],
      newPage: 1,
    })
    const result = await sut.execute({
      name: 'product-1',
    })

    expect(result.isRight()).toBe(true)
    expect(productsRepository.listByName).toBeCalledTimes(1)
  })
})
