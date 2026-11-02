import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type CurrentUserData,
} from '../../common/decorators/current-user.decorator.js';
import {
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/user-profile.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('User Profile')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ cá nhân của tài khoản đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin hồ sơ người dùng' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  getProfile(@CurrentUser() currentUser: CurrentUserData) {
    return this.usersService.getProfile(currentUser.userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật hồ sơ cá nhân (Họ tên, ngày sinh, nghề nghiệp, lĩnh vực quan tâm, ảnh đại diện)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật hồ sơ thành công' })
  @ApiBadRequestResponse({ description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  updateProfile(
    @CurrentUser() currentUser: CurrentUserData,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(currentUser.userId, dto);
  }

  @Patch('profile/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiBadRequestResponse({
    description: 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ',
  })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  changePassword(
    @CurrentUser() currentUser: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(currentUser.userId, dto);
  }
}

