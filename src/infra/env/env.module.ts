import { Module } from '@nestjs/common'
import { EnvService } from './env.service'

@Module({
  providers: [EnvService],
  exports: [EnvService],
})
// eslint-disable-next-line prettier/prettier
export class EnvModule { }
