import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum CatalogReferenceCsvImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPSERT = 'UPSERT',
}

export class PreviewCatalogReferenceCsvImportDto {
  @ApiPropertyOptional({
    enum: CatalogReferenceCsvImportMode,
    default: CatalogReferenceCsvImportMode.CREATE_ONLY,
  })
  @IsOptional()
  @IsEnum(CatalogReferenceCsvImportMode)
  mode?: CatalogReferenceCsvImportMode = CatalogReferenceCsvImportMode.CREATE_ONLY;
}
