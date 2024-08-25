import { User as PrismaUser, Prisma } from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser | User): User {
    return User.create(
      {
        cpf: raw.cpf,
        name: raw.name,
        email: raw.email,
        password: raw.password,
        role: raw.role as UserRole,
        adminId: raw.adminId ?? undefined,
        latitude: raw.latitude,
        longitude: raw.longitude,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt ?? raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id,
      cpf: user.cpf,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role as UserRole,
      adminId: user.adminId,
      latitude: user.latitude,
      longitude: user.longitude,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
