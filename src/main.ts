import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilitar CORS para futuras integraciones (Alexa, frontend, etc.)
  app.enableCors();

  // Render y otros servicios cloud asignan el puerto vía process.env.PORT
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Escuchar en todas las interfaces para Render

  console.log(`🚀 JARVIS Backend running on port: ${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/jarvis/ask`);
  console.log(`🎤 Alexa webhook: http://localhost:${port}/alexa/webhook`);
}

bootstrap();

