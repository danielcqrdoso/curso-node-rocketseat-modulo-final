import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { ProductsRepository } from '@/domain/delivery/application/repositories/products-repository'
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { PrismaUsersRepository } from './prisma/repositories/prisma-users-repository'
import { PrismaProductsRepository } from './prisma/repositories/prisma-products-repository'
import { PrismaPackagesRepository } from './prisma/repositories/prisma-packages-repository'
import { PrismaNotificationsRepository } from './prisma/repositories/prisma-notifications-repository'
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'

@Module({
  imports: [],
  providers: [
    PrismaService,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
    {
      provide: ProductsRepository,
      useClass: PrismaProductsRepository,
    },
    {
      provide: PackagesRepository,
      useClass: PrismaPackagesRepository,
    },
    {
      provide: NotificationsRepository,
      useClass: PrismaNotificationsRepository,
    },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    PackagesRepository,
    ProductsRepository,
    NotificationsRepository,
  ],
})

// eslint-disable-next-line prettier/prettier
export class DatabaseModule { }
