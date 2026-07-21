import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ProductCsvImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPSERT = 'UPSERT',
}

export class PreviewProductCsvImportDto {
  @ApiPropertyOptional({
    enum: ProductCsvImportMode,
    default: ProductCsvImportMode.CREATE_ONLY,
  })
  @IsOptional()
  @IsEnum(ProductCsvImportMode)
  mode?: ProductCsvImportMode = ProductCsvImportMode.CREATE_ONLY;
}
