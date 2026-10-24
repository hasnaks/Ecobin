import { NextFunction, Request, Response } from 'express';
import { Counter, Histogram, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();

export const httpRequests = new Counter({
  name: 'ecobin_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

export const httpDuration = new Histogram({
  name: 'ecobin_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
});

export const disposalsTotal = new Counter({
  name: 'ecobin_waste_disposals_total',
  help: 'Total waste disposals',
  labelNames: ['waste_type', 'correct'],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.path === '/graphql' ? '/graphql' : req.path === '/health' ? '/health' : 'other';
  const end = httpDuration.startTimer({ method: req.method, path });
  res.on('finish', () => {
    end();
    httpRequests.inc({ method: req.method, path, status: String(res.statusCode) });
  });
  next();
}
