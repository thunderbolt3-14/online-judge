const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const languageConfig = require('./languageConfig');

const docker = new Docker();

// Runs a single command inside a fresh container, with resource limits and a hard timeout.
// Returns { stdout, stderr, exitCode, timedOut }
const runInContainer = ({ image, cmd, hostDir, containerDir, memoryLimitKb, timeLimitMs, stdinData }) => {
  return new Promise(async (resolve, reject) => {
    let container;
    let timedOut = false;
    let timeoutHandle;

    try {
      container = await docker.createContainer({
        Image: image,
        Cmd: cmd,
        WorkingDir: containerDir,
        Tty: false,
        OpenStdin: true,
        StdinOnce: true,
        HostConfig: {
          Binds: [`${hostDir}:${containerDir}`],
          Memory: memoryLimitKb * 1024,
          MemorySwap: memoryLimitKb * 1024, // disable swap beyond the limit
          NanoCpus: 1_000_000_000, // 1 CPU core
          NetworkMode: 'none',
          AutoRemove: false, // we remove manually after reading logs
        },
      });

      const stream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true });

      let stdout = '';
      let stderr = '';

      container.modem.demuxStream(stream,
        { write: (chunk) => { stdout += chunk.toString(); } },
        { write: (chunk) => { stderr += chunk.toString(); } }
      );

      await container.start();

      if (stdinData) {
        stream.write(stdinData);
      }
      stream.end();

      timeoutHandle = setTimeout(async () => {
        timedOut = true;
        try { await container.kill(); } catch (e) { /* already stopped */ }
      }, timeLimitMs);

      const result = await container.wait();
      clearTimeout(timeoutHandle);

      resolve({ stdout, stderr, exitCode: result.StatusCode, timedOut });
    } catch (err) {
      clearTimeout(timeoutHandle);
      reject(err);
    } finally {
      if (container) {
        try { await container.remove({ force: true }); } catch (e) { /* ignore cleanup errors */ }
      }
    }
  });
};

// Judges one submission against one test case. Returns a verdict string + details.
const judgeTestCase = async ({ language, code, input, expectedOutput, timeLimitMs, memoryLimitKb }) => {
  const config = languageConfig[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const hostDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oj-'));
  const containerDir = '/code';

  try {
    fs.writeFileSync(path.join(hostDir, config.filename), code);

    // Compile step, if the language needs one
    if (config.compileCmd) {
      const outFile = path.posix.join(containerDir, 'a.out');
      const compileResult = await runInContainer({
        image: config.image,
        cmd: config.compileCmd(path.posix.join(containerDir, config.filename), outFile),
        hostDir,
        containerDir,
        memoryLimitKb,
        timeLimitMs: 10000, // generous fixed compile time limit
      });

      if (compileResult.exitCode !== 0) {
        return { status: 'compile_error', stderr: compileResult.stderr };
      }
    }

    // Run step
    const runCmd = config.compileCmd
      ? config.runCmd(path.posix.join(containerDir, 'a.out'))
      : config.runCmd(path.posix.join(containerDir, config.filename));

    const start = Date.now();
    const runResult = await runInContainer({
      image: config.image,
      cmd: runCmd,
      hostDir,
      containerDir,
      memoryLimitKb,
      timeLimitMs,
      stdinData: input,
    });
    const executionTimeMs = Date.now() - start;

    if (runResult.timedOut) {
      return { status: 'tle', executionTimeMs };
    }
    if (runResult.exitCode !== 0) {
      return { status: 'runtime_error', stderr: runResult.stderr, executionTimeMs };
    }

    const actual = runResult.stdout.trim();
    const expected = expectedOutput.trim();

    return {
      status: actual === expected ? 'accepted' : 'wrong_answer',
      executionTimeMs,
      actualOutput: actual,
    };
  } finally {
    fs.rmSync(hostDir, { recursive: true, force: true });
  }
};

module.exports = { judgeTestCase };