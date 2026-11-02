import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import { User, UserDocument } from './schemas/user.schema.js';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';
import { UploadsService } from '../uploads/uploads.service.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../auth/schemas/refresh-token.schema.js';
import {
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/user-profile.dto.js';
import {
  CreateManageUserDto,
  ManageUserQueryDto,
  ManageUserSort,
} from './dto/manage-user.dto.js';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface SerializedUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: string;
  avatar: string | null;
  dateOfBirth: Date | null;
  occupation: string | null;
  interestedCategories: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Optional() private readonly uploadsService?: UploadsService,
    @Optional()
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel?: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Tự động khởi tạo tài khoản ADMIN mặc định nếu DB chưa có tài khoản Admin nào
   */
  async onApplicationBootstrap() {
    try {
      const adminExists = await this.userModel.findOne({ role: Role.ADMIN });
      if (!adminExists) {
        const passwordHash = await argon2.hash('Admin@123456');
        await this.create({
          fullName: 'Quản trị viên Hệ thống',
          email: 'admin@nextcode.vn',
          passwordHash,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
        });
        this.logger.log(
          'Đã tự động khởi tạo tài khoản ADMIN mặc định: admin@nextcode.vn | Mật khẩu: Admin@123456',
        );
      }
    } catch (err) {
      this.logger.warn('Không thể kiểm tra hoặc khởi tạo Admin seeder:', err);
    }
  }

  serializeUser(user: UserDocument | Record<string, any>): SerializedUser {
    const rawId = user._id ?? user.id;
    const id = typeof rawId === 'string' ? rawId : rawId?.toString?.() ?? '';
    const categories = Array.isArray(user.interestedCategories)
      ? user.interestedCategories.map((item: unknown) =>
          typeof item === 'string' ? item : String(item),
        )
      : [];
    return {
      id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      occupation: user.occupation ?? null,
      interestedCategories: categories,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt,
    };
  }

  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    dateOfBirth?: Date | string | null;
    occupation?: string | null;
    avatar?: string | null;
    role?: Role;
    status?: string;
    interestedCategories?: (Types.ObjectId | string)[];
  }): Promise<UserDocument> {
    const formattedData: Record<string, unknown> = {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      occupation: data.occupation ?? null,
      avatar: data.avatar ?? null,
      role: data.role ?? Role.STUDENT,
      status: data.status ?? UserStatus.PENDING,
      interestedCategories: (data.interestedCategories ?? []).map((item) =>
        typeof item === 'string' && Types.ObjectId.isValid(item)
          ? new Types.ObjectId(item)
          : item,
      ),
    };

    const newUser = new this.userModel(formattedData);
    return newUser.save();
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findById(
    id: string,
    includePassword = false,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const query = this.userModel.findById(id);
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findActiveInstructors(): Promise<
    Array<{ id: string; fullName: string; email: string }>
  > {
    const instructors = await this.userModel
      .find(
        { role: Role.INSTRUCTOR, status: UserStatus.ACTIVE },
        { _id: 1, fullName: 1, email: 1 },
      )
      .sort({ fullName: 1, _id: 1 })
      .lean()
      .exec();

    return instructors.map((instructor) => ({
      id: instructor._id.toString(),
      fullName: instructor.fullName,
      email: instructor.email,
    }));
  }

  async isActiveInstructor(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    return Boolean(
      await this.userModel
        .exists({
          _id: new Types.ObjectId(id),
          role: Role.INSTRUCTOR,
          status: UserStatus.ACTIVE,
        })
        .exec(),
    );
  }

  async markActive(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { status: UserStatus.ACTIVE },
        { new: true },
      )
      .exec();
  }

  async updateRole(id: string, role: Role): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .exec();
  }

  async updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async updatePassword(
    id: string,
    passwordHash: string,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(id, { passwordHash }, { new: true })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  /**
   * Lấy hồ sơ cá nhân của người dùng hiện tại
   */
  async getProfile(userId: string): Promise<SerializedUser> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }
    return this.serializeUser(user);
  }

  /**
   * Cập nhật hồ sơ cá nhân (Họ tên, ngày sinh, nghề nghiệp, lĩnh vực quan tâm, avatar)
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ message: string; user: SerializedUser }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const previousAvatar = user.avatar ?? null;

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.dateOfBirth !== undefined) {
      user.dateOfBirth =
        dto.dateOfBirth === null || dto.dateOfBirth === ''
          ? undefined
          : new Date(dto.dateOfBirth);
    }
    if (dto.occupation !== undefined) {
      user.occupation =
        dto.occupation === null || dto.occupation.trim() === ''
          ? undefined
          : dto.occupation.trim();
    }
    if (dto.avatar !== undefined) {
      user.avatar =
        dto.avatar === null || dto.avatar.trim() === ''
          ? undefined
          : dto.avatar.trim();
    }
    if (dto.interestedCategories !== undefined) {
      user.interestedCategories = dto.interestedCategories
        .map((item) => item.trim())
        .filter(Boolean);
    }

    await user.save();

    if (
      dto.avatar !== undefined &&
      previousAvatar &&
      previousAvatar !== (user.avatar ?? null)
    ) {
      await this.uploadsService?.deleteLocalFile(previousAvatar);
    }

    return {
      message: 'Cập nhật hồ sơ cá nhân thành công',
      user: this.serializeUser(user),
    };
  }

  /**
   * Đổi mật khẩu của người dùng đang đăng nhập
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'Mật khẩu mới và xác nhận mật khẩu không khớp',
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại',
      );
    }

    const user = await this.findById(userId, true);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    let isMatch = false;
    try {
      isMatch = await argon2.verify(user.passwordHash, dto.currentPassword);
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);
    await this.updatePassword(user.id, newPasswordHash);

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  /**
   * Danh sách người dùng dành cho Admin quản trị (lọc, tìm kiếm, phân trang, thống kê)
   */
  async listManageUsers(query: ManageUserQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.keyword?.trim()) {
      const regex = new RegExp(escapeRegex(query.keyword.trim()), 'i');
      filter.$or = [{ fullName: regex }, { email: regex }];
    }
    if (query.role) {
      filter.role = query.role;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const sort: Record<string, 1 | -1> =
      query.sort === ManageUserSort.OLDEST
        ? { createdAt: 1, _id: 1 }
        : query.sort === ManageUserSort.NAME_ASC
          ? { fullName: 1, _id: 1 }
          : { createdAt: -1, _id: -1 };

    const skip = (query.page - 1) * query.limit;

    const [
      users,
      total,
      totalAll,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalLocked,
    ] = await Promise.all([
      this.userModel.find(filter).sort(sort).skip(skip).limit(query.limit).exec(),
      this.userModel.countDocuments(filter).exec(),
      this.userModel.countDocuments({}).exec(),
      this.userModel.countDocuments({ role: Role.STUDENT }).exec(),
      this.userModel.countDocuments({ role: Role.INSTRUCTOR }).exec(),
      this.userModel.countDocuments({ role: Role.ADMIN }).exec(),
      this.userModel.countDocuments({ status: UserStatus.LOCKED }).exec(),
    ]);

    return {
      items: users.map((user) => this.serializeUser(user)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      stats: {
        total: totalAll,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
        locked: totalLocked,
      },
    };
  }

  /**
   * Admin tạo mới tài khoản trực tiếp (kích hoạt ngay không cần OTP)
   */
  async createManageUser(
    dto: CreateManageUserDto,
  ): Promise<{ message: string; user: SerializedUser }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email này đã tồn tại trên hệ thống');
    }

    const passwordHash = await argon2.hash(dto.password);
    const created = await this.create({
      fullName: dto.fullName.trim(),
      email,
      passwordHash,
      role: dto.role,
      status: UserStatus.ACTIVE,
      occupation: dto.occupation?.trim() || null,
      dateOfBirth: dto.dateOfBirth || null,
    });

    return {
      message: 'Đã tạo tài khoản người dùng thành công',
      user: this.serializeUser(created),
    };
  }

  /**
   * Admin cập nhật vai trò người dùng
   */
  async updateManageUserRole(
    currentAdminId: string,
    targetUserId: string,
    role: Role,
  ): Promise<{ message: string; user: SerializedUser }> {
    if (currentAdminId === targetUserId && role !== Role.ADMIN) {
      throw new BadRequestException(
        'Quản trị viên không thể tự hạ quyền ADMIN của chính mình',
      );
    }

    const target = await this.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const updated = await this.updateRole(targetUserId, role);
    if (!updated) {
      throw new BadRequestException('Không thể cập nhật vai trò người dùng');
    }

    await this.refreshTokenModel
      ?.updateMany({ userId: updated._id }, { isRevoked: true })
      .exec();

    return {
      message: `Đã cập nhật vai trò tài khoản sang ${role}`,
      user: this.serializeUser(updated),
    };
  }

  /**
   * Admin khóa hoặc mở khóa tài khoản người dùng
   */
  async updateManageUserStatus(
    currentAdminId: string,
    targetUserId: string,
    status: UserStatus.ACTIVE | UserStatus.LOCKED,
  ): Promise<{ message: string; user: SerializedUser }> {
    if (currentAdminId === targetUserId && status === UserStatus.LOCKED) {
      throw new BadRequestException(
        'Quản trị viên không thể tự khóa tài khoản của chính mình',
      );
    }

    const target = await this.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    const updated = await this.updateStatus(targetUserId, status);
    if (!updated) {
      throw new BadRequestException('Không thể cập nhật trạng thái tài khoản');
    }

    if (status === UserStatus.LOCKED) {
      await this.refreshTokenModel
        ?.updateMany({ userId: updated._id }, { isRevoked: true })
        .exec();
    }

    return {
      message:
        status === UserStatus.LOCKED
          ? 'Đã khóa tài khoản người dùng'
          : 'Đã mở khóa tài khoản người dùng',
      user: this.serializeUser(updated),
    };
  }
}
