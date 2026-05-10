import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { AssignRolesDto } from './dto/assign-roles.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { GetOrg, GetUser } from '../../common/decorators/index.js';
import type { RequestUser } from '../../common/types/index.js';

@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users in the organization (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  findAll(
    @GetOrg() orgId: string,
    @Query() dto: QueryUsersDto,
  ) {
    return this.usersService.findAll(orgId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, description: 'Current user profile with roles' })
  getProfile(
    @GetOrg() orgId: string,
    @GetUser() user: RequestUser,
  ) {
    return this.usersService.getProfile(orgId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(orgId, id);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user to the organization' })
  @ApiResponse({ status: 201, description: 'User invited' })
  @ApiResponse({ status: 409, description: 'Email already exists in org' })
  invite(
    @GetOrg() orgId: string,
    @GetUser() user: RequestUser,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.invite(orgId, dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.remove(orgId, id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  @ApiResponse({ status: 200, description: 'User suspended' })
  @ApiResponse({ status: 409, description: 'Already suspended' })
  suspend(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.suspend(orgId, id);
  }

  @Post(':id/reinstate')
  @ApiOperation({ summary: 'Reinstate suspended user' })
  @ApiResponse({ status: 200, description: 'User reinstated' })
  @ApiResponse({ status: 409, description: 'Not suspended' })
  reinstate(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.reinstate(orgId, id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign roles to user (replaces existing)' })
  @ApiResponse({ status: 200, description: 'Roles assigned' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  assignRoles(
    @GetOrg() orgId: string,
    @GetUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.usersService.assignRoles(orgId, userId, dto.roleIds, user.id);
  }
}
