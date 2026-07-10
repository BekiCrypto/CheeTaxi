import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'AUDITOR', 'COMPLIANCE')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs (admin/auditor only)' })
  list(@Query() q: any) {
    return this.audit.list({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 50,
      actorUserId: q.actorUserId,
      action: q.action,
      resource: q.resource,
      from: q.from,
      to: q.to,
    });
  }
}
