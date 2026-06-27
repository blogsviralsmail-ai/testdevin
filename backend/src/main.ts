import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:5173'),
    credentials: true,
  });

  // Cookie parser
  app.use(cookieParser());

  // Session
  app.use(
    session({
      secret: configService.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: configService.get<string>('NODE_ENV') === 'production',
      },
    }),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Socket.io adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger API docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('WabaPanel API')
    .setDescription('WhatsApp Business API SaaS Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Static files for uploads
  app.setGlobalPrefix('api', { exclude: ['webhook/whatsapp', 'webhook/stripe', 'webhook/razorpay', 'webhook/shopify', 'webhook/woocommerce'] });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`WabaPanel backend running on port ${port}`);
}
bootstrap();
