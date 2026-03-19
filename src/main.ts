import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useWebSocketAdapter(new IoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Daraja Incident Status API')
    .setDescription(
      'Monitors Safaricom Daraja API health and incidents. Probes all M-Pesa endpoints every 30 seconds and aggregates results into incidents.',
    )
    .setVersion('1.0')
    .setContact(
      'Victor Preston',
      'https://github.com/victorpreston',
      'vp.prestonvictor@gmail.com',
    )
    .addTag('status', 'Overall system status and per-service health scores')
    .addTag('incidents', 'Incident history and detail with timeline updates')
    .addTag('subscribers', 'Subscribe to and unsubscribe from incident alerts')
    .addTag('callbacks', 'Daraja M-Pesa callback receiver')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
