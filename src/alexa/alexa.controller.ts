import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { JarvisService } from '../jarvis/jarvis.service';
import { alexaSpeak, alexaPlainText } from './alexa.utils';

@Controller('alexa')
export class AlexaController {
  private readonly logger = new Logger(AlexaController.name);

  constructor(private readonly jarvisService: JarvisService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleAlexa(@Body() payload: any) {
    try {
      this.logger.log('Solicitud recibida de Alexa');
      this.logger.debug(`Payload completo: ${JSON.stringify(payload)}`);
      
      const request = payload?.request;

      if (!request) {
        this.logger.error('Request no encontrado en el payload');
        const response = alexaPlainText(
          'Error: No se recibió una solicitud válida.',
          true,
        );
        this.logger.debug(`No request response: ${JSON.stringify(response)}`);
        return response;
      }

      // LaunchRequest - Cuando el usuario dice "Alexa, abre Jarvis"
      if (request.type === 'LaunchRequest') {
        this.logger.log('LaunchRequest recibido');
        const response = alexaPlainText(
          'Hola, soy Jarvis. ¿Qué deseas preguntar?',
          false,
        );
        this.logger.debug(`LaunchRequest response: ${JSON.stringify(response)}`);
        return response;
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
            const response = alexaPlainText(
              'No entendí la pregunta. Por favor, intenta nuevamente con una pregunta clara.',
              false,
            );
            this.logger.debug(`Empty question response: ${JSON.stringify(response)}`);
            return response;
          }

          try {
            this.logger.log(`Procesando pregunta: ${question}`);
            const jarvisResponse = await this.jarvisService.askJarvis({
              question: question.trim(),
            });

            if (!jarvisResponse || !jarvisResponse.answer) {
              this.logger.error('Respuesta vacía de JarvisService');
              const response = alexaPlainText(
                'Lo siento, no pude generar una respuesta. Por favor, intenta con otra pregunta.',
                false,
              );
              this.logger.debug(`Empty response from Jarvis: ${JSON.stringify(response)}`);
              return response;
            }

            // Limitar longitud de respuesta (Alexa tiene límite de 8000 caracteres)
            let answer = jarvisResponse.answer || '';
            if (answer.length > 7000) {
              this.logger.warn(`Respuesta muy larga (${answer.length} chars), truncando...`);
              answer = answer.substring(0, 7000) + '...';
            }

            // Devolver respuesta en formato PlainText (más compatible)
            this.logger.log('Respuesta generada exitosamente');
            const alexaResponse = alexaPlainText(answer, false);
            
            // Log de la respuesta que se envía a Alexa
            this.logger.debug(`Respuesta a enviar a Alexa: ${JSON.stringify(alexaResponse)}`);
            
            return alexaResponse;
          } catch (error) {
            this.logger.error(`Error al procesar pregunta: ${error.message}`, error.stack);
            const response = alexaPlainText(
              'Lo siento, ocurrió un error al procesar tu pregunta. Por favor, intenta de nuevo.',
              false,
            );
            this.logger.debug(`Error response: ${JSON.stringify(response)}`);
            return response;
          }
        }

        // Manejar otros intents si es necesario
        this.logger.warn(`Intent no reconocido: ${intent.name}`);
        const response = alexaPlainText(
          'No puedo procesar esa solicitud. Por favor, intenta hacer una pregunta.',
          false,
        );
        this.logger.debug(`Unknown intent response: ${JSON.stringify(response)}`);
        return response;
      }

      // SessionEndedRequest
      if (request.type === 'SessionEndedRequest') {
        this.logger.log('SessionEndedRequest recibido');
        const response = alexaPlainText('Hasta luego.', true);
        this.logger.debug(`SessionEnded response: ${JSON.stringify(response)}`);
        return response;
      }

      // Fallback - Para cualquier otro tipo de solicitud
      this.logger.warn(`Tipo de solicitud no reconocido: ${request.type}`);
      const response = alexaPlainText(
        'No entendí la solicitud. Por favor, intenta de nuevo.',
        true,
      );
      this.logger.debug(`Fallback response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      // Catch general para cualquier error no manejado
      this.logger.error(`Error crítico en handleAlexa: ${error.message}`, error.stack);
      const response = alexaPlainText(
        'Ocurrió un error procesando tu solicitud. Por favor, intenta más tarde.',
        true,
      );
      this.logger.debug(`Critical error response: ${JSON.stringify(response)}`);
      return response;
    }
  }
}

