#!/usr/bin/env node
/**
 * Builds the press kit's generated downloads from `src/capabilities/presskit/pressKit.ts`:
 *   - stann-lumo-bio-ko.txt / stann-lumo-bio-en.txt — the site's short and full biography
 *   - stann-lumo-press-kit.zip — every file in public/press/download (photos, PDFs, logo pack, bios), stored uncompressed
 * The output is byte-for-byte deterministic so the committed files can be checked in CI.
 *
 *   node scripts/build-press-downloads.mjs          write the files
 *   node scripts/build-press-downloads.mjs --check  exit 1 when a committed file is stale
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { crc32 } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DOWNLOAD_DIR = path.join(ROOT, 'public/press/download');
export const ZIP_NAME = 'stann-lumo-press-kit.zip';
const ZIP_FOLDER = 'stann-lumo-press-kit';
const bioName = (locale) => `stann-lumo-bio-${locale}.txt`;

/** Loads a TypeScript module from src/ with the `@/` alias (erasable syntax only, like the rest of the app). */
let hooksRegistered = false;
export async function importSource(relativePath) {
  if (!hooksRegistered) {
    registerHooks({
      resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('@/')) {
          const file = path.join(ROOT, 'src', `${specifier.slice(2)}.ts`);
          if (existsSync(file)) return { url: pathToFileURL(file).href, shortCircuit: true };
        }
        return nextResolve(specifier, context);
      },
      load(url, context, nextLoad) {
        if (url.startsWith('file:') && url.endsWith('.ts')) {
          return { format: 'module-typescript', source: readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
        }
        return nextLoad(url, context);
      },
    });
    hooksRegistered = true;
  }
  return import(pathToFileURL(path.join(ROOT, relativePath)).href);
}

export function bioText(copy, locale, { email, pressKitUrl }) {
  const heading = locale === 'ko'
    ? ['Stann Lumo — 바이오', '짧은 바이오', '전체 바이오', '섭외·프레스']
    : ['Stann Lumo — Biography', 'Short bio', 'Full bio', 'Booking · Press'];
  return [
    heading[0], '',
    heading[1], copy.shortBio, '',
    heading[2], copy.fullBio.join('\n\n'), '',
    `${heading[3]}: ${email}`, pressKitUrl, '',
  ].join('\n');
}

// 2026-01-01 00:00 as an MS-DOS timestamp, so rebuilding never changes the archive.
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const UTF8_NAMES = 0x0800;

/** A plain stored (method 0) ZIP: photos and PDFs are already compressed, and stored output is identical on every zlib. */
export function storedZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(UTF8_NAMES, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // made by Unix, so the mode below applies
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(UTF8_NAMES, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, data);
    centrals.push(central, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

function listFiles(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .flatMap((entry) => (entry.isDirectory()
      ? listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`]));
}

/** Returns every generated file as { name, data } relative to public/press/download. */
export async function buildPressDownloads() {
  const { PRESS_KIT_COPY, PRESS_CONTACT, CONTACT_EMAIL } = await importSource('src/capabilities/presskit/pressKit.ts');
  const web = PRESS_CONTACT.find((item) => item.label === 'Web');
  const pressKitUrl = new URL('press-kit', web.url).href;
  const bios = ['ko', 'en'].map((locale) => ({
    name: bioName(locale),
    data: Buffer.from(bioText(PRESS_KIT_COPY[locale], locale, { email: CONTACT_EMAIL, pressKitUrl }), 'utf8'),
  }));
  const generated = new Set([ZIP_NAME, ...bios.map((bio) => bio.name)]);
  const sources = listFiles(DOWNLOAD_DIR)
    .filter((name) => !generated.has(name))
    .map((name) => ({ name, data: readFileSync(path.join(DOWNLOAD_DIR, name)) }));
  const entries = [...sources, ...bios]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((entry) => ({ name: `${ZIP_FOLDER}/${entry.name}`, data: entry.data }));
  return [...bios, { name: ZIP_NAME, data: storedZip(entries) }];
}

/** "6.8MB" — the decimal-megabyte label the page shows next to downloads. */
export const sizeLabel = (bytes) => `${(bytes / 1_000_000).toFixed(1)}MB`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const stale = [];
  for (const file of await buildPressDownloads()) {
    const target = path.join(DOWNLOAD_DIR, file.name);
    const current = existsSync(target) ? readFileSync(target) : null;
    if (current && current.equals(file.data)) continue;
    if (check) stale.push(file.name);
    else writeFileSync(target, file.data);
    if (!check) console.log(`wrote public/press/download/${file.name} (${file.data.length} bytes)`);
  }
  if (stale.length > 0) {
    console.error(`stale press downloads: ${stale.join(', ')} — run node scripts/build-press-downloads.mjs`);
    process.exit(1);
  }
}
