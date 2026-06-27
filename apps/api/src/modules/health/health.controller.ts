import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@ApiTags('System')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Check API and database health status',
  })
  @ApiOkResponse({
    description: 'API and database are available',
  })
  @ApiServiceUnavailableResponse({
    description: 'Database is unavailable',
  })
  async check() {
    return this.healthService.check();
  }
}
