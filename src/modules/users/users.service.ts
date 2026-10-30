import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import { User, UserDocument } from './schemas/user.schema.js';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
    const formattedData: any = {
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
          : item, // giữ nguyên string label nếu không phải ObjectId
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

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel.findById(id).exec();
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

  async update(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }
}
