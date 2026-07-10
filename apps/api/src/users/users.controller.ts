import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationDto } from '../common/dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS', 'SUPPORT', 'AUDITOR')
  @ApiOperation({ summary: 'List users (paginated)' })
  list(@Query() q: PaginationDto & { search?: string; role?: string }) {
    return this.users.list({
      page: q.page ?? 1,
      limit: q.limit ?? 20,
      search: q.search,
      role: q.role,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user with roles and permissions' })
  me(@CurrentUser('id') id: string) {
    return this.users.getById(id);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS', 'SUPPORT', 'AUDITOR')
  @ApiOperation({ summary: 'Get user by ID' })
  getById(@Param('id') id: string) {
    return this.users.getById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(
    @CurrentUser('id') id: string,
    @Body() body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      avatarUrl?: string;
      preferredLanguage?: string;
      city?: string;
      gender?: string;
    },
  ) {
    return this.users.update(id, body);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Update user status (suspend/ban/activate)' })
  setStatus(@Param('id') id: string, @Body() body: { status: string; reason?: string }) {
    return this.users.setStatus(id, body.status, body.reason);
  }

  @Post(':id/roles')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Assign a role to a user' })
  assignRole(
    @Param('id') id: string,
    @Body() body: { role: string; scope?: string },
    @CurrentUser('id') grantedBy: string,
  ) {
    return this.users.assignRole(id, body.role, body.scope, grantedBy);
  }

  @Delete(':id/roles')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Revoke a role' })
  revokeRole(
    @Param('id') id: string,
    @Body() body: { role: string; scope?: string },
  ) {
    return this.users.revokeRole(id, body.role, body.scope);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'GDPR: schedule account deletion' })
  deleteMe(@CurrentUser('id') id: string) {
    return this.users.deleteAccount(id);
  }
}
