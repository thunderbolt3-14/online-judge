const client = require('prom-client');
const judgeQueue = require('./queue');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const queueWaitingGauge = new client.Gauge({
  name: 'judge_queue_waiting_jobs',
  help: 'Number of jobs currently waiting in the judge queue',
});
register.registerMetric(queueWaitingGauge);

const metricsMiddleware = (req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    end({ method: req.method, route, status_code: res.statusCode });
  });
  next();
};

const startQueueMetricsPolling = () => {
  setInterval(async () => {
    try {
      const waiting = await judgeQueue.getWaitingCount();
      queueWaitingGauge.set(waiting);
    } catch (err) {
      // Redis temporarily unreachable — skip this tick, try again on the next interval
    }
  }, 5000);
};

module.exports = { register, metricsMiddleware, startQueueMetricsPolling };