import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateUserAccessDto } from './dto/update-user-access.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: UserQueryDto,
  ) {
    return this.usersService.list(user.tenantId, query);
  }

  @Patch(':id/access')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateAccess(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserAccessDto,
  ) {
    return this.usersService.updateAccess(user.tenantId, userId, dto, {
      userId: user.userId,
      role: user.role as UserRole,
    });
  }
}
