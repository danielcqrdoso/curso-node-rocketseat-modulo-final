import { UserRole } from '@/domain/delivery/enterprise/entities/user'

export interface UpdateUserParams {
  name?: string
  password?: string
  role?: UserRole
  latitude?: number
  longitude?: number
}
