import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';

const ROLE_ENUM = [
  'PASSENGER',
  'DRIVER',
  'FLEET_MANAGER',
] as const;

export class SignupDto {
  @ApiProperty({ example: '+251911223344' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone must be in E.164 format (+2519...)' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
  password?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  firstName: string;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: ROLE_ENUM, default: 'PASSENGER' })
  @IsOptional()
  @IsEnum(ROLE_ENUM)
  role?: 'PASSENGER' | 'DRIVER' | 'FLEET_MANAGER' = 'PASSENGER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Phone (E.164) or email' })
  @IsString()
  identifier: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}

export class OtpRequestDto {
  @ApiProperty({ example: '+251911223344' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phone: string;

  @ApiPropertyOptional({ description: 'Purpose: login, signup, password-reset, phone-verify' })
  @IsOptional()
  @IsString()
  purpose?: string = 'login';
}

export class OtpVerifyDto {
  @ApiProperty({ example: '+251911223344' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
