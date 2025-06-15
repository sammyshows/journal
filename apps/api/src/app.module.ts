import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { JournalModule } from './journal/journal.module';
import { GraphModule } from './graph/graph.module';
import { SearchModule } from './search/search.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AiModule } from './ai/ai.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    AiModule,
    CommonModule,
    ChatModule,
    JournalModule,
    GraphModule,
    SearchModule,
    UsersModule,
  ],
})
export class AppModule {}