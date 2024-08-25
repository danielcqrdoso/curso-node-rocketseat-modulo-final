import { UpdateUserParams } from '@/core/repositories/update-user-params'
import { User } from '../../enterprise/entities/user'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { FindManyResponse } from '@/core/repositories/find-many-response'

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByEmail(email: string): Promise<User | null>
  abstract findByCPF(cpf: string): Promise<User | null>
  abstract listByAdminId(
    adminId: string,
    paginationParams: PaginationParams,
  ): Promise<FindManyResponse<User>>

  abstract create(user: User): Promise<void>
  abstract update(id: string, data: UpdateUserParams): Promise<User>
  abstract delete(id: string): Promise<void>
}
