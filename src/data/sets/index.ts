import type { SetConfig } from '@/types/domain';
import { lobConfig } from './lob';
import { mrdConfig } from './mrd';
import { rotdConfig } from './rotd';

export const SET_CONFIGS: SetConfig[] = [lobConfig, mrdConfig, rotdConfig];

export const SET_CONFIG_BY_ID: Record<string, SetConfig> = Object.fromEntries(
  SET_CONFIGS.map((s) => [s.setId, s]),
);

export { lobConfig, mrdConfig, rotdConfig };
