import { Module, Global } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { CommonModule } from '../common/common.module';

@Global()
@Module({
  imports: [CommonModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}