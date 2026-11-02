import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CertificateStatus } from '../../common/constants/learning.enum.js';
import { Course } from '../courses/schemas/course.schema.js';
import { User } from '../users/schemas/user.schema.js';
import {
  CertificateResponseDto,
  CertificateVerifyResponseDto,
} from './dto/certificate-response.dto.js';
import {
  Certificate,
  CertificateDocument,
} from './schemas/certificate.schema.js';

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCertificateCode(year = new Date().getFullYear()): string {
  const bytes = randomBytes(8);
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return `NC-${year}-${suffix}`;
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findByStudentAndCourse(
    studentId: string | Types.ObjectId,
    courseId: string | Types.ObjectId,
  ): Promise<CertificateDocument | null> {
    return this.certificateModel
      .findOne({
        studentId: new Types.ObjectId(studentId.toString()),
        courseId: new Types.ObjectId(courseId.toString()),
      })
      .exec();
  }

  async issueForEnrollment(
    studentId: string | Types.ObjectId,
    courseId: string | Types.ObjectId,
  ): Promise<CertificateResponseDto> {
    const studentObjectId = new Types.ObjectId(studentId.toString());
    const courseObjectId = new Types.ObjectId(courseId.toString());

    const existing = await this.certificateModel
      .findOne({
        studentId: studentObjectId,
        courseId: courseObjectId,
      })
      .exec();

    if (existing) {
      return this.serializeCertificate(existing);
    }

    let certificateCode = generateCertificateCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const collision = await this.certificateModel
        .exists({ certificateCode })
        .exec();
      if (!collision) break;
      certificateCode = generateCertificateCode();
    }

    const created = await this.certificateModel.create({
      certificateCode,
      studentId: studentObjectId,
      courseId: courseObjectId,
      issuedAt: new Date(),
      qrCode: `/certificates/verify/${certificateCode}`,
      fileUrl: null,
      status: CertificateStatus.VALID,
    });

    return this.serializeCertificate(created);
  }

  async getMyCertificates(studentId: string): Promise<CertificateResponseDto[]> {
    const certificates = await this.certificateModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ issuedAt: -1, _id: -1 })
      .exec();

    return Promise.all(
      certificates.map((cert) => this.serializeCertificate(cert)),
    );
  }

  async verifyByCode(rawCode: string): Promise<CertificateVerifyResponseDto> {
    const certificateCode = rawCode.trim().toUpperCase();
    const cert = await this.certificateModel
      .findOne({ certificateCode })
      .exec();

    if (!cert) {
      throw new NotFoundException('Không tìm thấy chứng chỉ với mã số này');
    }

    const dto = await this.serializeCertificate(cert);
    return {
      certificateCode: dto.certificateCode,
      status: dto.status,
      isValid: dto.status === CertificateStatus.VALID,
      issuedAt: dto.issuedAt,
      studentName: dto.studentName,
      courseTitle: dto.courseTitle,
      instructorName: dto.instructorName,
    };
  }

  private async serializeCertificate(
    cert: CertificateDocument,
  ): Promise<CertificateResponseDto> {
    const [student, course] = await Promise.all([
      this.userModel
        .findById(cert.studentId, { fullName: 1 })
        .lean()
        .exec(),
      this.courseModel
        .findById(cert.courseId, { title: 1, instructorId: 1 })
        .lean()
        .exec(),
    ]);

    const instructor = course?.instructorId
      ? await this.userModel
          .findById(course.instructorId, { fullName: 1 })
          .lean()
          .exec()
      : null;

    return {
      id: cert._id.toString(),
      certificateCode: cert.certificateCode,
      courseId: cert.courseId.toString(),
      courseTitle: course?.title ?? 'Khóa học NextCode',
      instructorName: instructor?.fullName ?? 'Giảng viên NextCode',
      studentName: student?.fullName ?? 'Học viên NextCode',
      issuedAt: cert.issuedAt.toISOString(),
      qrCode: cert.qrCode,
      fileUrl: cert.fileUrl ?? null,
      status: cert.status,
    };
  }
}

