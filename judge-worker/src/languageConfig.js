// Maps each supported language to its Docker image and run commands.
// {code} is the path to the submitted source file inside the container.

const languageConfig = {
  python: {
    image: 'python:3.11-alpine',
    filename: 'solution.py',
    runCmd: (file) => ['python', file],
  },
  cpp: {
    image: 'gcc:13-bookworm',
    filename: 'solution.cpp',
    compileCmd: (file, outFile) => ['g++', '-O2', '-o', outFile, file],
    runCmd: (outFile) => [outFile],
  },
  javascript: {
    image: 'node:20-alpine',
    filename: 'solution.js',
    runCmd: (file) => ['node', file],
  },
  java: {
    image: 'eclipse-temurin:21-jdk-alpine',
    filename: 'Main.java',
    compileCmd: (file) => ['javac', file],
    runCmd: () => ['java', 'Main'],
  },
};

module.exports = languageConfig;