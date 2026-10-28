import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectsAdminController } from './projects.controller';

describe('ProjectsAdminController', () => {
  it('is mounted at admin/projects', () => {
    expect(Reflect.getMetadata(PATH_METADATA, ProjectsAdminController)).toBe(
      'admin/projects',
    );
  });

  it('is protected by JwtAuthGuard at class level', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, ProjectsAdminController),
    ).toContain(JwtAuthGuard);
  });
});
