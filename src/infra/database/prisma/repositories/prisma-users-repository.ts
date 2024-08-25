import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { User } from '@/domain/delivery/enterprise/entities/user'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaUserMapper } from '../mappers/prisma-user-mapper'
import { UpdateUserParams } from '@/core/repositories/update-user-params'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { FindManyResponse } from '@/core/repositories/find-many-response'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(
    private prisma: PrismaService,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async findByCPF(cpf: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async listByAdminId(
    adminId: string,
    paginationParams: PaginationParams,
  ): Promise<FindManyResponse<User>> {
    const limit = paginationParams.limit ?? 100
    const page = paginationParams.page ?? 0

    const users = await this.prisma.user.findMany({
      where: {
        adminId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: page,
      take: limit,
    })

    const usersDomain: User[] = []
    users.forEach((user) => {
      usersDomain.push(PrismaUserMapper.toDomain(user))
    })

    return {
      entities: usersDomain,
      newPage: page + users.length,
    }
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user)

    await this.prisma.user.create({
      data,
    })
  }

  async update(id: string, data: UpdateUserParams): Promise<User> {
    const user = await this.prisma.user.update({
      data,
      where: { id },
    })

    return PrismaUserMapper.toDomain(user)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        id,
      },
    })
  }
}
