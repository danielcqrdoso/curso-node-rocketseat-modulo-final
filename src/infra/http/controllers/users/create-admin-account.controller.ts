import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { RegisterUserUseCase } from '@/domain/delivery/application/use-cases/users/register-user'
import { UserAlreadyExistsError } from '@/core/errors/errors/user-already-exists-error'
import { Public } from '@/infra/auth/public'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { Cpf } from '../../../../core/entities/cpf'

const createAccountBodySchema = z.object({
  name: z.string(),
  cpf: z.string().refine(Cpf.isValid, {
    message: 'Invalid Document',
  }),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]),
  latitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 90
  }),
  longitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 180
  }),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts/admin')
@Public()
export class CreateAdminAccountController {
  // eslint-disable-next-line prettier/prettier
  constructor(private registerUser: RegisterUserUseCase) { }

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    if (body.role === UserRole.DELIVERYMAN) {
      throw new BadRequestException(
        'Deliveryman cannot be create in this route',
      )
    }

    const result = await this.registerUser.execute({
      ...body,
      cpf: Cpf.onlyNumbers(body.cpf),
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case UserAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
    return {
      access_token: result.value.accessToken,
    }
  }
}
