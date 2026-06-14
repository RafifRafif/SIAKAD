import { rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const cachePaths = [
  resolve(join(projectRoot, '.next')),
  resolve(join(projectRoot, '.next-dev')),
];

for (const nextCachePath of cachePaths) {
  if (!nextCachePath.startsWith(projectRoot)) {
    throw new Error(`Refusing to remove path outside project: ${nextCachePath}`);
  }

  rmSync(nextCachePath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 300,
  });
}
