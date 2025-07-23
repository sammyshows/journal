import { Module, Global } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { CommonModule } from '../common/common.module';
import { AiModule } from 'src/ai/ai.module';
import { GraphProcessorService } from './processor.service';

@Global()
@Module({
  imports: [AiModule, CommonModule],
  controllers: [GraphController],
  providers: [GraphService, GraphProcessorService],
  exports: [GraphService, GraphProcessorService],
})
export class GraphModule {}