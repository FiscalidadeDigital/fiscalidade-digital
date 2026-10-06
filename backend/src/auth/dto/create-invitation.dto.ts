import { IsEmail, IsEnum, IsNotIn } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  @IsNotIn([UserRole.OWNER], { message: 'Convites não podem atribuir a função de proprietário.' })
  role!: UserRole;
}
