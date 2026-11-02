import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum.js';
import {
  CurrentUser,
  type CurrentUserData,
} from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  CreateManageUserDto,
  ManageUserIdParamsDto,
  ManageUserQueryDto,
  UpdateManageUserRoleDto,
  UpdateManageUserStatusDto,
} from './dto/manage-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('User Management (Admin)')
@ApiBearerAuth('bearer')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('manage/users')
export class ManageUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Danh sách người dùng toàn hệ thống (Chỉ ADMIN)' })
  @ApiResponse({ status: 200, description: 'Danh sách người dùng kèm thống kê' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Chỉ ADMIN có quyền truy cập' })
  listUsers(@Query() query: ManageUserQueryDto) {
    return this.usersService.listManageUsers(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo tài khoản mới trực tiếp ở trạng thái ACTIVE (Chỉ ADMIN)',
  })
  @ApiResponse({ status: 201, description: 'Đã tạo tài khoản mới thành công' })
  @ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiConflictResponse({ description: 'Email đã tồn tại' })
  @ApiForbiddenResponse({ description: 'Chỉ ADMIN có quyền tạo tài khoản' })
  createUser(@Body() dto: CreateManageUserDto) {
    return this.usersService.createManageUser(dto);
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phân quyền vai trò cho người dùng (Chỉ ADMIN)' })
  @ApiResponse({ status: 200, description: 'Đã cập nhật vai trò người dùng' })
  @ApiBadRequestResponse({ description: 'Không thể tự hạ quyền chính mình' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài khoản' })
  updateRole(
    @Param() params: ManageUserIdParamsDto,
    @Body() dto: UpdateManageUserRoleDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.updateManageUserRole(
      currentUser.userId,
      params.id,
      dto.role,
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Khóa hoặc mở khóa tài khoản người dùng (ACTIVE / LOCKED - Chỉ ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Đã cập nhật trạng thái tài khoản' })
  @ApiBadRequestResponse({ description: 'Không thể tự khóa tài khoản của chính mình' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài khoản' })
  updateStatus(
    @Param() params: ManageUserIdParamsDto,
    @Body() dto: UpdateManageUserStatusDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.updateManageUserStatus(
      currentUser.userId,
      params.id,
      dto.status,
    );
  }
}

