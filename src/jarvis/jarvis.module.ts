import { Module } from '@nestjs/common';
import { JarvisController } from './jarvis.controller';
import { JarvisService } from './jarvis.service';

@Module({
  controllers: [JarvisController],
  providers: [JarvisService],
  exports: [JarvisService], // Exportar para uso en otros módulos si es necesario
})
export class JarvisModule {}

