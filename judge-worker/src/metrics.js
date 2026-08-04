const client = require('prom-client');
const http = require('http');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const judgeDuration = new client.Histogram({
  name: 'judge_execution_duration_seconds',
  help: 'Time taken to judge a submission against all test cases',
  labelNames: ['language'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
});
register.registerMetric(judgeDuration);

const submissionsTotal = new client.Counter({
  name: 'judge_submissions_total',
  help: 'Total submissions judged, labeled by final verdict',
  labelNames: ['status'],
});
register.registerMetric(submissionsTotal);

const startMetricsServer = (port = 9200) => {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => console.log(`Metrics server listening on port ${port}`));
};

module.exports = { judgeDuration, submissionsTotal, startMetricsServer };