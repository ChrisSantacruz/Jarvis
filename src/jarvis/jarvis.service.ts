import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import { JARVIS_SYSTEM_PROMPT } from './jarvis.prompt';
import { AskJarvisDto, JarvisResponseDto } from './dto/ask-jarvis.dto';

@Injectable()
export class JarvisService {
  private readonly logger = new Logger(JarvisService.name);
  private readonly groq: Groq;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly topP: number;

  constructor(private readonly configService: ConfigService) {
    // Inicializar cliente Groq con API key desde variables de entorno
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY no está configurada. Por favor, configura la variable de entorno.',
      );
    }

    this.groq = new Groq({
      apiKey: apiKey,
    });

    // Cargar configuración del modelo desde variables de entorno
    this.model = this.configService.get<string>('GROQ_MODEL', 'llama-3.3-70b-versatile');
    this.temperature = parseFloat(
      this.configService.get<string>('GROQ_TEMPERATURE', '1'),
    );
    this.maxTokens = parseInt(
      this.configService.get<string>('GROQ_MAX_TOKENS', '1024'),
    );
    this.topP = parseFloat(this.configService.get<string>('GROQ_TOP_P', '1'));

    this.logger.log('JARVIS Service inicializado correctamente');
  }

  /**
   * Procesa una pregunta del usuario y devuelve la respuesta de JARVIS
   * @param askDto - DTO con la pregunta y contexto opcional
   * @returns Respuesta estructurada de JARVIS
   */
  async askJarvis(askDto: AskJarvisDto): Promise<JarvisResponseDto> {
    try {
      this.logger.log(`Procesando pregunta: ${askDto.question.substring(0, 50)}...`);

      // Construir mensajes para la conversación
      const messages = [
        {
          role: 'system' as const,
          content: JARVIS_SYSTEM_PROMPT,
        },
        {
          role: 'user' as const,
          content: askDto.question,
        },
      ];

      // Llamar a la API de Groq
      const chatCompletion = await this.groq.chat.completions.create({
        messages: messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
        stream: false,
      });

      // Extraer la respuesta del modelo
      const answer =
        chatCompletion.choices[0]?.message?.content ||
        'No se pudo generar una respuesta.';

      this.logger.log('Respuesta generada exitosamente');

      // Construir respuesta estructurada
      const response: JarvisResponseDto = {
        answer: answer,
        conversationId: askDto.conversationId || undefined,
        timestamp: new Date().toISOString(),
        model: this.model,
      };

      return response;
    } catch (error) {
      this.logger.error(`Error al procesar pregunta: ${error.message}`, error.stack);
      
      if (error instanceof Error) {
        throw new BadRequestException(
          `Error al procesar la solicitud: ${error.message}`,
        );
      }
      
      throw new BadRequestException('Error desconocido al procesar la solicitud');
    }
  }

  /**
   * Procesa una pregunta con streaming (para futuras integraciones)
   * @param askDto - DTO con la pregunta
   * @param onChunk - Callback para cada chunk de respuesta
   */
  async askJarvisStream(
    askDto: AskJarvisDto,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    try {
      this.logger.log(`Procesando pregunta con streaming: ${askDto.question.substring(0, 50)}...`);

      const messages = [
        {
          role: 'system' as const,
          content: JARVIS_SYSTEM_PROMPT,
        },
        {
          role: 'user' as const,
          content: askDto.question,
        },
      ];

      const chatCompletion = await this.groq.chat.completions.create({
        messages: messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
        stream: true,
      });

      // Procesar chunks de respuesta
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error) {
      this.logger.error(`Error en streaming: ${error.message}`, error.stack);
      throw new BadRequestException(
        `Error al procesar la solicitud con streaming: ${error.message}`,
      );
    }
  }
}

