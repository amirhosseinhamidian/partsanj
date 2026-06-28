import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VehicleSlugParamDto } from './dto/vehicle-slug-param.dto.js';
import { VehiclesService } from './vehicles.service.js';

@ApiTags('Vehicles')
@Controller({
  path: 'vehicles',
  version: '1',
})
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('makes')
  @ApiOperation({
    summary: 'List active vehicle makes',
  })
  @ApiOkResponse()
  findMakes() {
    return this.vehiclesService.findActiveMakes();
  }

  @Get('makes/:slug/models')
  @ApiOperation({
    summary: 'List active models for an active vehicle make',
  })
  @ApiOkResponse()
  @ApiNotFoundResponse({
    description: 'Vehicle make does not exist or is inactive',
  })
  findModelsByMake(@Param() params: VehicleSlugParamDto) {
    return this.vehiclesService.findActiveModelsByMakeSlug(params.slug);
  }

  @Get('models/:slug/variants')
  @ApiOperation({
    summary: 'List active variants for an active vehicle model',
  })
  @ApiOkResponse()
  @ApiNotFoundResponse({
    description: 'Vehicle model does not exist or is inactive',
  })
  findVariantsByModel(@Param() params: VehicleSlugParamDto) {
    return this.vehiclesService.findActiveVariantsByModelSlug(params.slug);
  }
}
