import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service.js';
import { LoginSuperAdminDto } from './dto/login-super-admin.dto.js';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto.js';
import { QueryAdminDto, QueryAdminInvoicesDto } from './dto/query-admin.dto.js';
import { Public } from '../../common/decorators/index.js';
import { SuperAdminGuard } from '../../common/guards/index.js';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Super admin login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginSuperAdminDto) {
    return this.superAdminService.login(dto);
  }

  // ─── Authenticated (Super Admin) ─────────────────────────────────────────

  @Get('stats')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Get platform-wide dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  getStats() {
    return this.superAdminService.getStats();
  }

  @Get('super-admins')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'List super admin accounts' })
  @ApiResponse({ status: 200, description: 'Paginated super admin list' })
  listSuperAdmins(@Query() dto: QueryAdminDto) {
    return this.superAdminService.listSuperAdmins(dto);
  }

  @Post('super-admins')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new super admin account' })
  @ApiResponse({ status: 201, description: 'Super admin created' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  createSuperAdmin(@Body() dto: CreateSuperAdminDto) {
    return this.superAdminService.createSuperAdmin(dto);
  }

  @Post('orgs/:id/impersonate')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Impersonate an organization' })
  @ApiResponse({ status: 200, description: 'Impersonation token generated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  impersonateOrg(@Param('id', ParseUUIDPipe) id: string) {
    return this.superAdminService.impersonateOrg(id);
  }

  @Get('usage')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Get global per-organization usage breakdown' })
  @ApiResponse({ status: 200, description: 'Global usage data' })
  getGlobalUsage() {
    return this.superAdminService.getGlobalUsage();
  }

  @Get('invoices')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'List all invoices across organizations' })
  @ApiResponse({ status: 200, description: 'Paginated invoices' })
  listAllInvoices(@Query() dto: QueryAdminInvoicesDto) {
    return this.superAdminService.listAllInvoices(dto);
  }

  @Patch('invoices/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Mark an invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 409, description: 'Invoice already paid' })
  markInvoicePaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.superAdminService.markInvoicePaid(id);
  }

  @Post('plans')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  createPlan(
    @Body()
    body: {
      name: string;
      slug: string;
      priceMonthlyInr?: number;
      priceYearlyInr?: number;
      features?: Record<string, unknown>;
      razorpayPlanIdMonthly?: string;
      razorpayPlanIdYearly?: string;
      stripePriceIdMonthly?: string;
      stripePriceIdYearly?: string;
    },
  ) {
    return this.superAdminService.createPlan(body);
  }

  @Patch('plans/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Update a plan' })
  @ApiResponse({ status: 200, description: 'Plan updated' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  updatePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      name?: string;
      priceMonthlyInr?: number;
      priceYearlyInr?: number;
      features?: Record<string, unknown>;
      isActive?: boolean;
      razorpayPlanIdMonthly?: string;
      razorpayPlanIdYearly?: string;
      stripePriceIdMonthly?: string;
      stripePriceIdYearly?: string;
    },
  ) {
    return this.superAdminService.updatePlan(id, body);
  }
}
