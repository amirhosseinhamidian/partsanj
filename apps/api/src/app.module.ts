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
  ],
})
export class AppModule {}
