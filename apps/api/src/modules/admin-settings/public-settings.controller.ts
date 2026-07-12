import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminSettingsService } from './admin-settings.service.js';

@ApiTags('Settings')
@Controller({
  path: 'settings',
  version: '1',
})
export class PublicSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get public site settings',
  })
  @ApiOkResponse()
  findPublicSettings() {
    return this.adminSettingsService.findPublicSettings();
  }
}
