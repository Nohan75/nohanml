import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'portfolio';
  }

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<string> {
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(`Upload échoué : ${error.message}`);
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(filename);
    return data.publicUrl;
  }
}
