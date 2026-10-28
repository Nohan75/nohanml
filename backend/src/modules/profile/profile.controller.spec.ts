import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileAdminController } from './profile.controller';

describe('ProfileAdminController', () => {
  it('is mounted at admin/profile', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ProfileAdminController)).toBe(
      'admin/profile',
    );
  });

  it('is protected by JwtAuthGuard at class level', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ProfileAdminController),
    ).toContain(JwtAuthGuard);
  });
});
