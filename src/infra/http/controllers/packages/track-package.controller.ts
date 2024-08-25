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
import { FetchPackageUseCase } from '@/domain/delivery/application/use-cases/package/fetch-package'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { PackageStatus } from '@/domain/delivery/enterprise/entities/package'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

const trackPackageBodySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).optional().default(10),
  deliveryPersonId: z.string().optional(),
  recipientId: z.string().optional(),
  packageId: z.string().optional(),
  isDeleted: z.boolean().optional(),
  status: z
    .enum(Object.values(PackageStatus) as [PackageStatus, ...PackageStatus[]])
    .optional(),
  latitude: z.coerce
    .number()
    .refine((value) => {
      return Math.abs(value) <= 90
    })
    .optional(),
  longitude: z.coerce
    .number()
    .refine((value) => {
      return Math.abs(value) <= 180
    })
    .optional(),
})

const bodyValidationPipe = new ZodValidationPipe(trackPackageBodySchema)

type TrackPackageBodySchema = z.infer<typeof trackPackageBodySchema>

@Controller('/package/track')
export class TrackPackageController {
  // eslint-disable-next-line prettier/prettier
  constructor(private fetchPackage: FetchPackageUseCase) { }

  @Post()
  @HttpCode(200)
  async handle(
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationPipe) body: TrackPackageBodySchema,
  ) {
    const { latitude, longitude } = body

    switch (user.role) {
      case UserRole.RECIPIENT:
        body.recipientId = user.sub
        body.deliveryPersonId = undefined
        break

      case UserRole.DELIVERYMAN:
        body.recipientId = undefined
        body.deliveryPersonId = user.sub
        break

      case UserRole.ADMIN:
        body.recipientId = undefined
        if (!body.deliveryPersonId) {
          throw new ConflictException(
            'An admin needs to pass a delivery person id',
          )
        }
        break
    }

    const result = await this.fetchPackage.execute({
      id: body.packageId,
      adminId: user.role === UserRole.ADMIN ? user.sub : undefined,
      paginationParams: {
        ...body,
      },
      filters: {
        ...body,
        location: latitude && longitude ? { latitude, longitude } : undefined,
      },
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof NotFoundError || error instanceof NotAllowedError) {
        throw new ConflictException(error.message)
      } else {
        throw new BadRequestException('Something went wrong')
      }
    }

    return result
  }
}
