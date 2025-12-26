import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JarvisModule } from './jarvis/jarvis.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JarvisModule,
  ],
})
export class AppModule {}

