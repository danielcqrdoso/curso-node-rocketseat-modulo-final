import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { PackFactory } from 'test/factories/make-package'
import { ProductFactory } from 'test/factories/make-product'
import { PackageStatus } from '@/domain/delivery/enterprise/entities/package'

describe('Track package (E2E) - [POST] /package/track', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let packFactory: PackFactory
  let productFactory: ProductFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, PackFactory, ProductFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    packFactory = moduleRef.get(PackFactory)
    productFactory = moduleRef.get(ProductFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  it('should track a package base on recipientId', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })
    const product = await productFactory.makePrismaProduct()
    await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user.id,
    })

    await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user.id,
      isDeleted: true,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'RECIPIENT',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package/track')
      .send({
        isDeleted: false,
        limit: 10,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    const packageOnDatabase = await prisma.package.findMany({
      where: {
        recipientId: user.id,
        isDeleted: false,
      },
    })

    expect(response.body.value.entities.length).toBe(1)
    expect(response.body.value.entities[0].props.id).toBe(
      packageOnDatabase[0].id,
    )
  })

  it('should track a package base on deliveryPersonId', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.DELIVERYMAN,
    })
    const recipient = await userFactory.makePrismaUser({
      role: UserRole.RECIPIENT,
    })

    const product = await productFactory.makePrismaProduct()
    await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: recipient.id,
      deliveryPersonId: user.id,
      status: PackageStatus.AVAILABLE_PICKUP,
    })

    await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: recipient.id,
      deliveryPersonId: user.id,
      status: PackageStatus.WAITING,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'DELIVERYMAN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package/track')
      .send({
        status: PackageStatus.WAITING,
        limit: 10,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    const packageOnDatabase = await prisma.package.findMany({
      where: {
        deliveryPersonId: user.id,
        status: PackageStatus.WAITING,
      },
    })

    expect(response.body.value.entities.length).toBe(1)
    expect(response.body.value.entities[0].props.id).toBe(
      packageOnDatabase[0].id,
    )
  })

  it('should track a package base on packageId', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })
    const product = await productFactory.makePrismaProduct()
    const pack = await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user.id,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'RECIPIENT',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package/track')
      .send({
        packageId: pack.id,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    expect(response.body.value.entities.length).toBe(1)
    expect(response.body.value.entities[0].props.id).toBe(pack.id.toString())
  })

  it('shouldnt track a package because package isnt match recipientId', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })
    const user2 = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })
    const product = await productFactory.makePrismaProduct()
    const pack = await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user2.id,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'RECIPIENT',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package/track')
      .send({
        packageId: pack.id,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)
  })

  it('shouldnt track a package because admin dont pass deliveryPersonId', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package/track')
      .send({
        isDeleted: false,
        limit: 10,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)
  })
})
