import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  FileTypeValidator,
  HttpCode,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ReturnPackageUseCase } from '@/domain/delivery/application/use-cases/package/return-package'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileType } from '@/core/repositories/photo-params'
import { InvalidAttachmentTypeError } from '@/core/errors/errors/invalid-attachment-type-error'
import { FileNameAlreadyExistsError } from '@/core/errors/errors/file-name-already-exists-error'

const returnPackageBodySchema = z.object({
  packageId: z.string(),
  latitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 90
  }),
  longitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 180
  }),
})

const bodyValidationPipe = new ZodValidationPipe(returnPackageBodySchema)

type ReturnPackageBodySchema = z.infer<typeof returnPackageBodySchema>

@Controller('/package/return')
export class ReturnPackageController {
  // eslint-disable-next-line prettier/prettier
  constructor(private returnPackage: ReturnPackageUseCase) { }

  @Patch()
  @HttpCode(204)
  @UseInterceptors(FileInterceptor('photo'))
  async handle(
    @ExclusiveRoute([UserRole.RECIPIENT]) user: UserPayload,
    @Body(bodyValidationPipe) body: ReturnPackageBodySchema,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 2, // 2mb
          }),
          new FileTypeValidator({
            fileType: '.(png|jpg|jpeg)',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.returnPackage.execute({
      id: body.packageId,
      recipientPersonId: user.sub,
      photo: {
        fileBody: file.buffer,
        fileName: file.originalname,
        fileType: file.mimetype.replace('image/', '').toUpperCase() as FileType,
      },
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
      },
    })

    if (result.isLeft()) {
      const error = result.value

      if (
        error instanceof NotFoundError ||
        error instanceof NotAllowedError ||
        error instanceof InvalidAttachmentTypeError ||
        error instanceof FileNameAlreadyExistsError
      ) {
        throw new ConflictException(error.message)
      } else {
        throw new BadRequestException('Something went wrong')
      }
    }
  }
}
