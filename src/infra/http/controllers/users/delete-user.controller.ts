import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common'
import { DeleteUserUseCase } from '@/domain/delivery/application/use-cases/users/delete-user'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

@Controller('/accounts/delete/:id')
export class DeleteUserController {
  // eslint-disable-next-line prettier/prettier
  constructor(private deleteUser: DeleteUserUseCase) { }

  @Delete()
  @HttpCode(204)
  async handle(
    @ExclusiveRoute([UserRole.ADMIN, UserRole.RECIPIENT]) user: UserPayload,
    @Param('id')
    id: string,
  ) {
    if (user.role.toString() === UserRole.RECIPIENT && user.sub !== id) {
      throw new BadRequestException(
        'The recipient can only delete their own account.',
      )
    }
    const result = await this.deleteUser.execute({
      id,
      adminId: user.role === UserRole.RECIPIENT ? undefined : user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof NotFoundError || error instanceof NotAllowedError) {
        throw new ConflictException(error.message)
      } else {
        throw new BadRequestException(error.message)
      }
    }
  }
}
