import { Module, Global } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';

@Global()
@Module({
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}