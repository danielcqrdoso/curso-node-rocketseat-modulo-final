import { Module } from '@nestjs/common'

import { Encrypter } from '@/domain/delivery/application/cryptography/encrypter'
import { HashComparer } from '@/domain/delivery/application/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/delivery/application/cryptography/hash-generator'

import { JwtEncrypter } from './jwt-encrypter'
import { BcryptHasher } from './bcrypt-hasher'
import { EnvModule } from '../env/env.module'

@Module({
  imports: [EnvModule],
  providers: [
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: HashComparer, useClass: BcryptHasher },
    { provide: HashGenerator, useClass: BcryptHasher },
  ],
  exports: [Encrypter, HashComparer, HashGenerator],
})
// eslint-disable-next-line prettier/prettier
export class CryptographyModule { }
