import { Module } from '@nestjs/common';
import { EntityExtractionService } from './entity-extraction.service';
import { GraphProcessorService } from './graph-processor.service';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [AiModule, DatabaseModule],
  providers: [EntityExtractionService, GraphProcessorService],
  exports: [EntityExtractionService, GraphProcessorService],
})
export class CommonModule {}