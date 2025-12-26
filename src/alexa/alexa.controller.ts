import { Controller, Post, Body, Logger } from '@nestjs/common';
import { JarvisService } from '../jarvis/jarvis.service';
import { alexaSpeak } from './alexa.utils';

@Controller('alexa')
export class AlexaController {
  private readonly logger = new Logger(AlexaController.name);

  constructor(private readonly jarvisService: JarvisService) {}

  @Post('webhook')
  async handleAlexa(@Body() payload: any) {
    try {
      this.logger.log('Solicitud recibida de Alexa');
      this.logger.debug(`Payload completo: ${JSON.stringify(payload)}`);
      
      const request = payload?.request;

      if (!request) {
        this.logger.error('Request no encontrado en el payload');
        return alexaSpeak(
          'Error: No se recibió una solicitud válida.',
          true,
        );
      }

      // LaunchRequest - Cuando el usuario dice "Alexa, abre Jarvis"
      if (request.type === 'LaunchRequest') {
        this.logger.log('LaunchRequest recibido');
        return alexaSpeak(
          'Hola, soy Jarvis. ¿Qué deseas preguntar?',
          false,
        );
      }

      // IntentRequest - Cuando el usuario hace una pregunta
      if (request.type === 'IntentRequest') {
        this.logger.log(`IntentRequest recibido: ${request?.intent?.name}`);
        
        const intent = request?.intent;

        if (!intent) {
          this.logger.warn('Intent no encontrado en la solicitud');
          return alexaSpeak(
            'No pude identificar tu solicitud. Por favor, intenta nuevamente.',
            false,
          );
        }

        // Manejar AskJarvisIntent
        if (intent.name === 'AskJarvisIntent') {
          // Intentar obtener la pregunta de diferentes formatos de slots
          const questionSlot = intent?.slots?.question;
          let question = questionSlot?.value || 
                        questionSlot?.slotValue?.value || 
                        null;

          this.logger.debug(`Slot question recibido: ${JSON.stringify(questionSlot)}`);
          this.logger.debug(`Pregunta extraída: ${question}`);

          if (!question || question.trim() === '') {
            this.logger.warn('Pregunta no encontrada o vacía en los slots');
            return alexaSpeak(
              'No entendí la pregunta. Por favor, intenta nuevamente con una pregunta clara.',
              false,
            );
          }

          try {
            this.logger.log(`Procesando pregunta: ${question}`);
            const jarvisResponse = await this.jarvisService.askJarvis({
              question: question.trim(),
            });

            if (!jarvisResponse || !jarvisResponse.answer) {
              this.logger.error('Respuesta vacía de JarvisService');
              return alexaSpeak(
                'Lo siento, no pude generar una respuesta. Por favor, intenta con otra pregunta.',
                false,
              );
            }

            // Devolver respuesta en formato SSML
            this.logger.log('Respuesta generada exitosamente');
            return alexaSpeak(jarvisResponse.answer, false);
          } catch (error) {
            this.logger.error(`Error al procesar pregunta: ${error.message}`, error.stack);
            return alexaSpeak(
              'Lo siento, ocurrió un error al procesar tu pregunta. Por favor, intenta de nuevo.',
              false,
            );
          }
        }

        // Manejar otros intents si es necesario
        this.logger.warn(`Intent no reconocido: ${intent.name}`);
        return alexaSpeak(
          'No puedo procesar esa solicitud. Por favor, intenta hacer una pregunta.',
          false,
        );
      }

      // SessionEndedRequest
      if (request.type === 'SessionEndedRequest') {
        this.logger.log('SessionEndedRequest recibido');
        return alexaSpeak('Hasta luego.', true);
      }

      // Fallback - Para cualquier otro tipo de solicitud
      this.logger.warn(`Tipo de solicitud no reconocido: ${request.type}`);
      return alexaSpeak(
        'No entendí la solicitud. Por favor, intenta de nuevo.',
        true,
      );
    } catch (error) {
      // Catch general para cualquier error no manejado
      this.logger.error(`Error crítico en handleAlexa: ${error.message}`, error.stack);
      return alexaSpeak(
        'Ocurrió un error procesando tu solicitud. Por favor, intenta más tarde.',
        true,
      );
    }
  }
}

