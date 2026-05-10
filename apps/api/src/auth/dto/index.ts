import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string

  @ApiProperty({ example: "stylesnap_user", minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, { message: "Username: lowercase letters, numbers, underscores only" })
  username!: string

  @ApiProperty({ example: "Alex Kim" })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  referralCode?: string
}

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string

  @ApiProperty()
  @IsString()
  password!: string
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string
}
