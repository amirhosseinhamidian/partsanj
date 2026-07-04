import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogAdminModule } from './modules/catalog/admin/catalog-admin.module.js';
import { VehicleAdminModule } from './modules/vehicles/admin/vehicle-admin.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module.js';
import { OrderModule } from './modules/order/order.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { AdminOrderModule } from './modules/admin-order/admin-order.module.js';
import { CustomerOrderModule } from './modules/customer-order/customer-order.module.js';
import { CustomerProfileModule } from './modules/customer-profile/customer-profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    DatabaseModule,
    HealthModule,
    CatalogModule,
    AuthModule,
    CatalogAdminModule,
    VehicleAdminModule,
    VehiclesModule,
    CartModule,
    CustomerAddressModule,
    OrderModule,
    PaymentModule,
    AdminOrderModule,
    CustomerOrderModule,
    CustomerProfileModule,
  ],
})
export class AppModule {}
