import { Module } from '@nestjs/common'

import { CryptographyModule } from '../cryptography/cryptography.module'
import { AuthenticateUserUseCase } from '@/domain/delivery/application/use-cases/users/authenticate-user'
import { AvailablePickupPackageUseCase } from '@/domain/delivery/application/use-cases/package/available-pickup-package'
import { ChangeUserLocationUseCase } from '@/domain/delivery/application/use-cases/users/change-user-location'
import { ChangeUserPasswordUseCase } from '@/domain/delivery/application/use-cases/users/change-user-password'
import { CreatePackageUseCase } from '@/domain/delivery/application/use-cases/package/create-package'
import { CreateProductUseCase } from '@/domain/delivery/application/use-cases/product/create-product'
import { DeletePackageUseCase } from '@/domain/delivery/application/use-cases/package/delete-package'
import { DeleteUserUseCase } from '@/domain/delivery/application/use-cases/users/delete-user'
import { DeliverPackageUseCase } from '@/domain/delivery/application/use-cases/package/deliver-package'
import { FetchPackageUseCase } from '@/domain/delivery/application/use-cases/package/fetch-package'
import { PickupPackageUseCase } from '@/domain/delivery/application/use-cases/package/pickup-package'
import { RegisterUserUseCase } from '@/domain/delivery/application/use-cases/users/register-user'
import { ReturnPackageUseCase } from '@/domain/delivery/application/use-cases/package/return-package'
import { CreateAdminAccountController } from './controllers/users/create-admin-account.controller'
import { DatabaseModule } from '../database/database.module'
import { EmailModule } from '../emails/email.module'
import { AuthenticateController } from './controllers/users/authenticate.controller'
import { DeleteUserController } from './controllers/users/delete-user.controller'
import { CreateDeliverymanAccountController } from './controllers/users/create-deliveryman-account.controller'
import { ChangePasswordController } from './controllers/users/change-password.controller'
import { ChangeDeliverymanPasswordController } from './controllers/users/change-password-deliveryman.controller'
import { ChangeLocationController } from './controllers/users/change-location-user.controller'
import { CreateProductController } from './controllers/products/create-product.controller'
import { CreatePackageController } from './controllers/packages/create-package.controller'
import { TrackPackageController } from './controllers/packages/track-package.controller'
import { CancelPackageController } from './controllers/packages/cancel-package.controller'
import { DeliverPackageController } from './controllers/packages/deliver-package.controller'
import { PickupPackageController } from './controllers/packages/pickup-package.controller'
import { AvailablePickupPackageController } from './controllers/packages/available-pickup-package.controller'
import { ReturnPackageController } from './controllers/packages/return-package.controller'
import { FetchProductUseCase } from '@/domain/delivery/application/use-cases/product/fetch-product'
import { FetchProductController } from './controllers/products/fetch-product.controller'
import { FetchUsersUseCase } from '@/domain/delivery/application/use-cases/users/fetch-users-by-adminid'
import { FindUsersByAdminIdController } from './controllers/users/find-users-by-adminid.controller'
import { FetchNotificationUseCase } from '@/domain/notification/application/use-cases/fetch-notification'
import { FindNotificationsController } from './controllers/notifications/find-notification.controller'

@Module({
  imports: [DatabaseModule, CryptographyModule, EmailModule],
  controllers: [
    CreateAdminAccountController,
    CreateDeliverymanAccountController,
    AuthenticateController,
    DeleteUserController,
    ChangePasswordController,
    ChangeDeliverymanPasswordController,
    ChangeLocationController,
    CreateProductController,
    CreatePackageController,
    TrackPackageController,
    CancelPackageController,
    DeliverPackageController,
    PickupPackageController,
    AvailablePickupPackageController,
    ReturnPackageController,
    FetchProductController,
    FindUsersByAdminIdController,
    FindNotificationsController,
  ],
  providers: [
    AuthenticateUserUseCase,
    AvailablePickupPackageUseCase,
    ChangeUserLocationUseCase,
    ChangeUserPasswordUseCase,
    CreatePackageUseCase,
    CreateProductUseCase,
    DeletePackageUseCase,
    DeleteUserUseCase,
    DeliverPackageUseCase,
    FetchPackageUseCase,
    PickupPackageUseCase,
    RegisterUserUseCase,
    ReturnPackageUseCase,
    FetchProductUseCase,
    FetchUsersUseCase,
    FetchNotificationUseCase,
  ],
})
// eslint-disable-next-line prettier/prettier
export class HttpModule { }
