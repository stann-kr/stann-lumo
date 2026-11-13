import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { crc32 } from 'node:zlib';
import { DOWNLOAD_DIR, ZIP_NAME, buildPressDownloads, importSource, sizeLabel } from './build-press-downloads.mjs';

const built = await buildPressDownloads();

test('committed press downloads match the bios and source files', () => {
  for (const file of built) {
    const target = path.join(DOWNLOAD_DIR, file.name);
    assert.ok(existsSync(target), `${file.name} is missing — run node scripts/build-press-downloads.mjs`);
    assert.ok(readFileSync(target).equals(file.data), `${file.name} is stale — run node scripts/build-press-downloads.mjs`);
  }
});

test('the archive is a readable ZIP whose entries carry their own bytes', () => {
  const zip = built.find((file) => file.name === ZIP_NAME).data;
  const end = zip.length - 22;
  assert.equal(zip.readUInt32LE(end), 0x06054b50);
  const count = zip.readUInt16LE(end + 10);
  let cursor = zip.readUInt32LE(end + 16);
  const names = [];
  for (let index = 0; index < count; index += 1) {
    assert.equal(zip.readUInt32LE(cursor), 0x02014b50);
    const size = zip.readUInt32LE(cursor + 24);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const name = zip.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    const local = zip.readUInt32LE(cursor + 42);
    assert.equal(zip.readUInt32LE(local), 0x04034b50);
    assert.equal(zip.toString('utf8', local + 30, local + 30 + nameLength), name);
    const start = local + 30 + nameLength;
    assert.equal(crc32(zip.subarray(start, start + size)), zip.readUInt32LE(cursor + 16), name);
    names.push(name);
    cursor += 46 + nameLength;
  }
  assert.ok(names.includes('stann-lumo-press-kit/logo/StannLumo_Logo_White.svg'));
  assert.ok(names.includes('stann-lumo-press-kit/stann-lumo-bio-ko.txt'));
  assert.ok(!names.some((name) => name.endsWith('.zip')));
});

test('the page labels the archive with its real size', async () => {
  const { PRESS_ZIP } = await importSource('src/capabilities/presskit/pressKit.ts');
  const zip = built.find((file) => file.name === ZIP_NAME).data;
  assert.equal(PRESS_ZIP.file, `/press/download/${ZIP_NAME}`);
  assert.equal(PRESS_ZIP.size, sizeLabel(zip.length));
});
