import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { RegisterUserUseCase } from '@/domain/delivery/application/use-cases/users/register-user'
import { UserAlreadyExistsError } from '@/core/errors/errors/user-already-exists-error'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { Cpf } from '../../../../core/entities/cpf'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'

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

const bodyValidationPipe = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts/deliveryman')
export class CreateDeliverymanAccountController {
  // eslint-disable-next-line prettier/prettier
  constructor(private registerUser: RegisterUserUseCase) { }

  @Post()
  @HttpCode(201)
  async handle(
    @ExclusiveRoute([UserRole.ADMIN]) user: UserPayload,
    @Body(bodyValidationPipe) body: CreateAccountBodySchema,
  ) {
    if (body.role !== UserRole.DELIVERYMAN) {
      throw new BadRequestException(
        'This route is only for create deliveryman accounts',
      )
    }

    const result = await this.registerUser.execute({
      ...body,
      adminId: user.sub,
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
