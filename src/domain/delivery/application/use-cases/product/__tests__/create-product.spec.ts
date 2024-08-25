import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaProductsRepository } from '@/infra/database/prisma/repositories/prisma-products-repository'
import { CreateProductUseCase } from '../create-product'
import { faker } from '@faker-js/faker'

let productsRepository: PrismaProductsRepository
let sut: CreateProductUseCase

describe('Create Product', () => {
  beforeEach(() => {
    productsRepository = new PrismaProductsRepository(new PrismaService())
    sut = new CreateProductUseCase(productsRepository)
  })

  it('should be able to create a pack', async () => {
    vi.spyOn(productsRepository, 'create').mockResolvedValueOnce()
    const result = await sut.execute({
      name: 'product-1',
      description: 'description-1',
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    })

    expect(result.isRight()).toBe(true)
    expect(productsRepository.create).toBeCalledTimes(1)
  })
})
