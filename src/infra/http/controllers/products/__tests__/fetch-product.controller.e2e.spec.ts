import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ProductFactory } from 'test/factories/make-product'
import { DatabaseModule } from '@/infra/database/database.module'

describe('Fetch product (E2E) - [POST] /product/fetch', () => {
  let app: INestApplication
  let productFactory: ProductFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [ProductFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    productFactory = moduleRef.get(ProductFactory)

    await app.init()
  })

  it('should fetch two products', async () => {
    await productFactory.makePrismaProduct({
      name: 'Product1',
    })
    await productFactory.makePrismaProduct({
      name: 'Product2',
    })

    const response = await request(app.getHttpServer())
      .post('/product/fetch')
      .send({
        name: 'Product',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.value.entities.length).toBe(2)
    expect(response.body.value.entities[0].props.name).toBe('Product1')
    expect(response.body.value.entities[1].props.name).toBe('Product2')
  })
})
