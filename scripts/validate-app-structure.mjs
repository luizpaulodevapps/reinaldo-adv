import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const PAGE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const ROUTE_ENTRY_FILES = new Set([
  ...PAGE_FILES,
  'layout.tsx',
  'layout.ts',
  'layout.jsx',
  'layout.js',
  'route.ts',
  'route.js',
]);

function walk(dir, visitor) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    visitor(fullPath, entry);
    if (entry.isDirectory()) {
      walk(fullPath, visitor);
    }
  }
}

function isRouteGroupSegment(segment) {
  return segment.startsWith('(') && segment.endsWith(')');
}

function isParallelRouteSegment(segment) {
  return segment.startsWith('@');
}

function normalizeRouteFromPageFile(pageFilePath) {
  const pageDir = path.dirname(pageFilePath);
  const relativeDir = path.relative(APP_DIR, pageDir);
  if (!relativeDir || relativeDir === '.') return '/';

  const segments = relativeDir
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !isRouteGroupSegment(segment))
    .filter((segment) => !isParallelRouteSegment(segment));

  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

function listEmptyDirectories(baseDir) {
  const emptyDirs = [];

  walk(baseDir, (fullPath, entry) => {
    if (!entry.isDirectory()) return;
    const children = readdirSync(fullPath);
    if (children.length === 0) {
      emptyDirs.push(fullPath);
    }
  });

  return emptyDirs;
}

function listPageFiles(baseDir) {
  const pages = [];

  walk(baseDir, (fullPath, entry) => {
    if (!entry.isFile()) return;
    if (!PAGE_FILES.has(entry.name)) return;
    pages.push(fullPath);
  });

  return pages;
}

function hasRouteFiles(dir) {
  const children = readdirSync(dir, { withFileTypes: true });
  return children.some((child) => child.isFile() && ROUTE_ENTRY_FILES.has(child.name));
}

function collectLeafFoldersWithoutRouteFile(baseDir) {
  const missing = [];

  walk(baseDir, (fullPath, entry) => {
    if (!entry.isDirectory()) return;

    const children = readdirSync(fullPath, { withFileTypes: true });
    const hasSubdirectories = children.some((child) => child.isDirectory());

    // Ignore non-leaf folders and folders used only as containers.
    if (hasSubdirectories) return;

    // Root app folder should not be validated as a route leaf.
    if (fullPath === baseDir) return;

    if (!hasRouteFiles(fullPath)) {
      missing.push(fullPath);
    }
  });

  return missing;
}

function toRelative(targetPath) {
  return path.relative(ROOT, targetPath).split(path.sep).join('/');
}

if (!statSync(APP_DIR, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('ERROR: src/app directory not found.');
  process.exit(1);
}

const pageFiles = listPageFiles(APP_DIR);
const routesByPath = new Map();

for (const pageFile of pageFiles) {
  const route = normalizeRouteFromPageFile(pageFile);
  const list = routesByPath.get(route) || [];
  list.push(pageFile);
  routesByPath.set(route, list);
}

const duplicatedRoutes = [...routesByPath.entries()]
  .filter(([, files]) => files.length > 1)
  .sort(([a], [b]) => a.localeCompare(b));

if (duplicatedRoutes.length > 0) {
  console.error('ERROR: Duplicate Next.js app routes found after normalization:');
  for (const [route, files] of duplicatedRoutes) {
    console.error(`  - ${route}`);
    for (const file of files) {
      console.error(`      • ${toRelative(file)}`);
    }
  }
  console.error('');
  console.error('Fix: keep only one page file per normalized route path.');
  process.exit(1);
}

const emptyDirs = listEmptyDirectories(APP_DIR).sort();
if (emptyDirs.length > 0) {
  console.warn('WARNING: Empty directories found under src/app:');
  for (const dir of emptyDirs) {
    console.warn(`  - ${toRelative(dir)}`);
  }
  console.warn('');
}

const leafFoldersWithoutRoute = collectLeafFoldersWithoutRouteFile(APP_DIR)
  .filter((dir) => !emptyDirs.includes(dir))
  .sort();

if (leafFoldersWithoutRoute.length > 0) {
  console.warn('WARNING: Leaf app folders without page/layout/route file:');
  for (const dir of leafFoldersWithoutRoute) {
    console.warn(`  - ${toRelative(dir)}`);
  }
  console.warn('');
}

console.log('App structure validation passed.');
