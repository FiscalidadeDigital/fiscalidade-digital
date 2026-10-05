import { IsEmail, IsString, Length, MinLength } from 'class-validator';
export class ResetPasswordDto {
  @IsEmail() email!: string;
  @IsString() @Length(6, 6) code!: string;
  @IsString() @MinLength(12) password!: string;
  @IsString() @MinLength(12) confirmPassword!: string;
}
