import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JarvisService } from './jarvis.service';
import { AskJarvisDto, JarvisResponseDto } from './dto/ask-jarvis.dto';

@Controller('jarvis')
export class JarvisController {
  private readonly logger = new Logger(JarvisController.name);

  constructor(private readonly jarvisService: JarvisService) {}

  /**
   * Endpoint principal para hacer preguntas a JARVIS
   * POST /jarvis/ask
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async askJarvis(@Body() askDto: AskJarvisDto): Promise<JarvisResponseDto> {
    this.logger.log(`Nueva solicitud recibida: ${askDto.question.substring(0, 50)}...`);
    
    return await this.jarvisService.askJarvis(askDto);
  }

  /**
   * Endpoint de salud/health check
   * GET /jarvis/health
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  health(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'JARVIS Backend',
      timestamp: new Date().toISOString(),
    };
  }
}

