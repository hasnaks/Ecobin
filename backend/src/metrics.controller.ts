import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';

@Controller()
export class MetricsController {
  @Get('health')
  health() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
