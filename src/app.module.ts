import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    AiModule,
  ],
})
export class AppModule {}
export class AppModule {}
