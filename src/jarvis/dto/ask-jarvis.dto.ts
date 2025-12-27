import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * DTO para la petición de pregunta a JARVIS
 */
export class AskJarvisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, {
    message: 'La pregunta no puede exceder 5000 caracteres',
  })
  question: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

/**
 * DTO para la respuesta de JARVIS
 */
export class JarvisResponseDto {
  answer: string;
  conversationId?: string;
  timestamp: string;
  model?: string;
  imageUrl?: string;
  isImageResponse?: boolean;
}

