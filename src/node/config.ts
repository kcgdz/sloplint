import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { CATEGORIES, rulesById } from '../core/rules/index.js';
import type { RuleSetting, Severity } from '../core/types.js';

export interface SloplintConfig {
  /** Per-rule or per-category settings: `"vocab/delve": "off"`, `"format/*": "info"`. */
  rules?: Record<string, RuleSetting>;
  /** Glob patterns excluded from linting. */
  ignore?: string[];
  /** Exit with code 1 when any file scores above this. */
  maxScore?: number;
  /** Exit with code 1 when a finding of this severity or higher exists. Default `error`. */
  failOn?: Severity | 'none';
  /** Skip text inside double quotes. */
  skipQuoted?: boolean;
}

export class ConfigError extends Error {
  override name = 'ConfigError';
}

export const CONFIG_FILES = ['.sloplintrc', '.sloplintrc.json'];

const SEVERITIES = new Set(['off', 'info', 'warning', 'error']);
const KNOWN_KEYS = new Set(['$schema', 'rules', 'ignore', 'maxScore', 'failOn', 'skipQuoted']);

/** Walks up from `cwd` looking for `.sloplintrc`, `.sloplintrc.json`, or a `sloplint` key in package.json. */
export function findConfigFile(cwd: string = process.cwd()): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    for (const name of CONFIG_FILES) {
      const p = join(dir, name);
      if (existsSync(p)) return p;
    }
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      try {
        if (JSON.parse(readFileSync(pkg, 'utf8')).sloplint) return pkg;
      } catch {
        // A broken package.json is not ours to report.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function validateConfig(
  raw: unknown,
  source: string,
): { config: SloplintConfig; warnings: string[] } {
  const warnings: string[] = [];
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ConfigError(`${source}: config must be a JSON object.`);
  }
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!KNOWN_KEYS.has(key)) warnings.push(`${source}: unknown key "${key}" is ignored.`);
  }

  const categories = new Set<string>(CATEGORIES.map((c) => c.id));
  if (obj.rules !== undefined) {
    if (typeof obj.rules !== 'object' || obj.rules === null || Array.isArray(obj.rules)) {
      throw new ConfigError(`${source}: "rules" must be an object.`);
    }
    for (const [id, setting] of Object.entries(obj.rules)) {
      const category = id.replace(/\/\*$/, '');
      if (!rulesById.has(id) && !categories.has(category)) {
        warnings.push(`${source}: unknown rule "${id}".`);
      }
      const severity = Array.isArray(setting) ? setting[0] : setting;
      if (typeof severity !== 'string' || !SEVERITIES.has(severity)) {
        throw new ConfigError(
          `${source}: rule "${id}" has invalid setting ${JSON.stringify(setting)}. Use "off", "info", "warning", "error", or ["warning", { ...options }].`,
        );
      }
      if (
        Array.isArray(setting) &&
        setting[1] !== undefined &&
        (typeof setting[1] !== 'object' || setting[1] === null)
      ) {
        throw new ConfigError(`${source}: options for rule "${id}" must be an object.`);
      }
    }
  }
  if (
    obj.ignore !== undefined &&
    (!Array.isArray(obj.ignore) || obj.ignore.some((g) => typeof g !== 'string'))
  ) {
    throw new ConfigError(`${source}: "ignore" must be an array of glob strings.`);
  }
  if (
    obj.maxScore !== undefined &&
    (typeof obj.maxScore !== 'number' || obj.maxScore < 0 || obj.maxScore > 100)
  ) {
    throw new ConfigError(`${source}: "maxScore" must be a number from 0 to 100.`);
  }
  if (
    obj.failOn !== undefined &&
    !['error', 'warning', 'info', 'none'].includes(String(obj.failOn))
  ) {
    throw new ConfigError(`${source}: "failOn" must be "error", "warning", "info" or "none".`);
  }
  if (obj.skipQuoted !== undefined && typeof obj.skipQuoted !== 'boolean') {
    throw new ConfigError(`${source}: "skipQuoted" must be true or false.`);
  }
  return { config: obj as SloplintConfig, warnings };
}

export interface LoadedConfig {
  config: SloplintConfig;
  path?: string;
  warnings: string[];
}

/** Loads an explicit config path, or discovers one from `cwd`. */
export function loadConfig(explicitPath?: string, cwd: string = process.cwd()): LoadedConfig {
  const path = explicitPath ? resolve(cwd, explicitPath) : findConfigFile(cwd);
  if (!path) return { config: {}, warnings: [] };
  if (!existsSync(path)) throw new ConfigError(`Config file not found: ${path}`);

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new ConfigError(`${path}: invalid JSON (${(err as Error).message}).`);
  }
  if (path.endsWith('package.json')) raw = (raw as Record<string, unknown>).sloplint ?? {};
  const { config, warnings } = validateConfig(raw, path);
  return { config, path, warnings };
}
