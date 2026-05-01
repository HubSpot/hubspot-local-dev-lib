import fs from 'fs';
import os from 'os';
import path from 'path';
import { vi } from 'vitest';
import { LogBuffer } from '../LogBuffer.js';

describe('lib/LogBuffer', () => {
  describe('record / view / flush', () => {
    it('captures recorded entries with the given level label', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['hello']);
      buf.record('ERROR', ['boom']);

      const viewed = buf.view();
      expect(viewed).toContain('[LOG] hello');
      expect(viewed).toContain('[ERROR] boom');
    });

    it('view is non-destructive', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['first']);
      buf.record('LOG', ['second']);
      expect(buf.view().split('\n')).toHaveLength(2);
      expect(buf.view().split('\n')).toHaveLength(2);
    });

    it('flush returns the joined contents and clears the buffer', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['alpha']);
      buf.record('LOG', ['beta']);

      const flushed = buf.flush();
      expect(flushed).toContain('alpha');
      expect(flushed).toContain('beta');
      expect(buf.view()).toBe('');
      expect(buf.flush()).toBe('');
    });

    it('prefixes entries with an ISO timestamp', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['timed']);
      expect(buf.view()).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[LOG\] timed$/
      );
    });

    it('joins multiple args with spaces', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['hello', 'world', 42]);
      expect(buf.view()).toContain('[LOG] hello world 42');
    });
  });

  describe('byte-limited buffer', () => {
    it('drops oldest entries once the buffer exceeds the byte limit', () => {
      const buf = new LogBuffer({ byteLimit: 300 });
      buf.record('LOG', ['A'.repeat(80)]);
      buf.record('LOG', ['B'.repeat(80)]);
      buf.record('LOG', ['C'.repeat(80)]);

      const viewed = buf.view();
      expect(viewed).not.toContain('A'.repeat(80));
      expect(viewed).toContain('B'.repeat(80));
      expect(viewed).toContain('C'.repeat(80));
    });

    it('retains the most recent entry even if it alone exceeds the limit', () => {
      const buf = new LogBuffer({ byteLimit: 200 });
      buf.record('LOG', ['A'.repeat(60)]);
      buf.record('LOG', ['huge'.repeat(50)]);

      expect(buf.view()).toContain('huge'.repeat(50));
    });

    it('lowering the limit drops entries already in the buffer', () => {
      const buf = new LogBuffer({ byteLimit: 10000 });
      for (let i = 0; i < 5; i++) {
        buf.record('LOG', ['X'.repeat(200)]);
      }
      const before = buf.view().split('\n').length;
      expect(before).toBe(5);

      buf.setByteLimit(500);
      expect(buf.view().split('\n').length).toBeLessThan(before);
    });

    it('flush resets the byte counter so the cap applies fresh', () => {
      const buf = new LogBuffer({ byteLimit: 400 });
      buf.record('LOG', ['X'.repeat(120)]);
      buf.record('LOG', ['Y'.repeat(120)]);
      buf.flush();

      buf.record('LOG', ['Z'.repeat(120)]);
      buf.record('LOG', ['W'.repeat(120)]);

      const viewed = buf.view();
      expect(viewed).toContain('Z'.repeat(120));
      expect(viewed).toContain('W'.repeat(120));
    });
  });

  describe('writeToFile()', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logbuffer-test-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns null and does not write when the buffer is empty', () => {
      const buf = new LogBuffer();
      const result = buf.writeToFile({ dir: tmpDir, commandName: 'test' });
      expect(result).toBeNull();
      expect(fs.readdirSync(tmpDir)).toHaveLength(0);
    });

    it('creates the directory and writes a sanitized filename', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['captured']);

      const dir = path.join(tmpDir, 'logs');
      const filePath = buf.writeToFile({ dir, commandName: 'account list' });

      expect(filePath).not.toBeNull();
      expect(fs.existsSync(dir)).toBe(true);
      const filename = path.basename(filePath as string);
      expect(filename.startsWith('account-list-')).toBe(true);
      expect(filename.endsWith('.log')).toBe(true);
      expect(fs.readFileSync(filePath as string, 'utf8')).toContain(
        '[LOG] captured'
      );
    });

    it('always clears the buffer regardless of write success', () => {
      const buf = new LogBuffer();
      buf.record('LOG', ['captured']);
      const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('disk full');
      });

      const result = buf.writeToFile({ dir: tmpDir, commandName: 'cmd' });
      expect(result).toBeNull();
      expect(buf.view()).toBe('');
      writeSpy.mockRestore();
    });

    it('caps the directory at maxFiles by deleting oldest first', () => {
      const dir = path.join(tmpDir, 'logs');
      fs.mkdirSync(dir, { recursive: true });

      ['oldest.log', 'middle.log', 'newest.log'].forEach((name, idx) => {
        const full = path.join(dir, name);
        fs.writeFileSync(full, name);
        const t = new Date(2026, 0, idx + 1);
        fs.utimesSync(full, t, t);
      });

      const buf = new LogBuffer();
      buf.record('LOG', ['fresh']);
      buf.writeToFile({ dir, commandName: 'cmd', maxFiles: 3 });

      const remaining = fs.readdirSync(dir);
      expect(remaining).toHaveLength(3);
      expect(remaining).not.toContain('oldest.log');
      expect(remaining).toContain('middle.log');
      expect(remaining).toContain('newest.log');
    });
  });
});
