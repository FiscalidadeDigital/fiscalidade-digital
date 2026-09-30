import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangeAdminPasswordDto {
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'A nova palavra-passe deve incluir maiúscula, minúscula, número e símbolo.',
  })
  newPassword: string;
}
