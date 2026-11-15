import { describe, expect, it } from 'vitest';
import { isMixType } from './content';

describe('isMixType', () => {
  it('treats mixes and sets as mixes but a remix as a release', () => {
    for (const type of ['DJ Mix', 'Live Set', 'mix', 'Hybrid Set']) expect(isMixType(type)).toBe(true);
    for (const type of ['Remix', 'Original', 'Settings', '', undefined]) expect(isMixType(type)).toBe(false);
  });
});
