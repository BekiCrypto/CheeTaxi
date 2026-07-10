import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('rules')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPLIANCE', 'AUDITOR')
  @ApiOperation({ summary: 'List all data residency rules' })
  listRules() {
    return this.compliance.listRules();
  }

  @Post('rules')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Create or update a data residency rule' })
  upsertRule(@Body() body: any) {
    return this.compliance.upsertRule(body);
  }

  @Get('region')
  @ApiOperation({ summary: 'Get the required storage region for a country + data type' })
  getRegion(@Query('country') country: string, @Query('dataType') dataType: string) {
    return this.compliance.getStorageRegion(country, dataType);
  }

  @Post('gdpr/erase')
  @ApiOperation({ summary: 'GDPR right to erasure — delete all my data' })
  gdprErase(@CurrentUser('id') userId: string) {
    return this.compliance.deleteUserdata(userId);
  }

  @Get('gdpr/export')
  @ApiOperation({ summary: 'GDPR right to portability — export all my data as JSON' })
  gdprExport(@CurrentUser('id') userId: string) {
    return this.compliance.exportUserData(userId);
  }
}
