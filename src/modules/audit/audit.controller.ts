import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service.js';
import { QueryAuditDto, QueryAdminAuditDto } from './dto/query-audit.dto.js';
import { GetOrg } from '../../common/decorators/index.js';
import { SuperAdminGuard } from '../../common/guards/index.js';

@ApiTags('Audit')
@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs for the current organization' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  findAll(@GetOrg() orgId: string, @Query() dto: QueryAuditDto) {
    return this.auditService.findAll(orgId, dto);
  }
}

@ApiTags('Admin - Audit')
@UseGuards(SuperAdminGuard)
@Controller('api/v1/admin/audit')
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs across all organizations (super admin)' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs across all orgs' })
  findAllAdmin(@Query() dto: QueryAdminAuditDto) {
    return this.auditService.findAllAdmin(dto);
  }
}
