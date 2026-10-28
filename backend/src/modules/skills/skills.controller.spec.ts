import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SkillsAdminController } from './skills.controller';

describe('SkillsAdminController', () => {
  it('is mounted at admin/skills', () => {
    expect(Reflect.getMetadata(PATH_METADATA, SkillsAdminController)).toBe(
      'admin/skills',
    );
  });

  it('is protected by JwtAuthGuard at class level', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, SkillsAdminController),
    ).toContain(JwtAuthGuard);
  });
});
