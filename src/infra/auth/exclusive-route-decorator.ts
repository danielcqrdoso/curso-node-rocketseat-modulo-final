import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common'
import { UserPayload } from './jwt.strategy'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'

export const ExclusiveRoute = (roles: UserRole[]) =>
  createParamDecorator((_: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const user = request.user as UserPayload
    if (!roles.includes(user.role)) {
      throw new BadRequestException(
        `This route is only for ${roles.join(', ')} accounts`,
      )
    }
    return user
  })()
