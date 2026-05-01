import fs from 'fs';
import path from 'path';

const DEFAULT_BYTE_LIMIT = 128 * 1024 * 1024;
const DEFAULT_MAX_LOG_FILES = 3;

export type LogBufferOptions = {
  byteLimit?: number;
};

export type WriteBufferedLogsOptions = {
  dir: string;
  commandName: string;
  maxFiles?: number;
};

function sanitizeFilenamePart(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function rotateLogFiles(dir: string, maxFiles: number): void {
  const entries = fs
    .readdirSync(dir)
    .map(name => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      return { full, mtimeMs: stat.mtimeMs, isFile: stat.isFile() };
    })
    .filter(entry => entry.isFile)
    .sort((a, b) => a.mtimeMs - b.mtimeMs);

  while (entries.length >= maxFiles) {
    const oldest = entries.shift();
    if (oldest) {
      fs.unlinkSync(oldest.full);
    }
  }
}

/**
 * In-memory ring buffer of log entries with a byte cap. Designed to be
 * composed into a logger so that recent log output can be flushed to a file
 * after a failure. Each record is timestamped and tagged with the level the
 * caller provides.
 */
export class LogBuffer {
  private entries: string[] = [];
  private bytes = 0;
  private byteLimit: number;

  constructor(options: LogBufferOptions = {}) {
    this.byteLimit = options.byteLimit ?? DEFAULT_BYTE_LIMIT;
  }

  // +1 accounts for the '\n' separator that join('\n') will insert between entries.
  private static entrySize(entry: string): number {
    return Buffer.byteLength(entry, 'utf8') + 1;
  }

  // Drop oldest entries until under the cap. Always retains at least the most
  // recent entry so a single oversized message is still captured.
  private trimToByteLimit(): void {
    while (this.bytes > this.byteLimit && this.entries.length > 1) {
      const removed = this.entries.shift() as string;
      this.bytes -= LogBuffer.entrySize(removed);
    }
  }

  record(level: string, args: unknown[]): void {
    const message = args.map(arg => String(arg)).join(' ');
    const entry = `[${new Date().toISOString()}] [${level}] ${message}`;
    this.entries.push(entry);
    this.bytes += LogBuffer.entrySize(entry);
    this.trimToByteLimit();
  }

  view(): string {
    return this.entries.join('\n');
  }

  flush(): string {
    const out = this.entries.join('\n');
    this.entries.length = 0;
    this.bytes = 0;
    return out;
  }

  setByteLimit(bytes: number): void {
    this.byteLimit = bytes;
    this.trimToByteLimit();
  }

  // Flush the buffer to a rotating log file. Always clears the buffer (even
  // on write failure). Returns the written file path on success, or null if
  // the buffer was empty or the write failed.
  writeToFile(options: WriteBufferedLogsOptions): string | null {
    const { dir, commandName, maxFiles = DEFAULT_MAX_LOG_FILES } = options;
    const contents = this.flush();
    if (!contents) {
      return null;
    }
    try {
      fs.mkdirSync(dir, { recursive: true });
      rotateLogFiles(dir, maxFiles);
      const filename = `${sanitizeFilenamePart(commandName)}-${timestampForFilename()}.log`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, contents, 'utf8');
      return filePath;
    } catch (_e) {
      return null;
    }
  }
}
