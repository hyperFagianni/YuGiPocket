import { canOpenPack, formatCountdown, msUntilNextPack, PACK_COOLDOWN_MS } from '@/services/cooldown';

describe('canOpenPack', () => {
  it('allows opening when no pack has ever been opened', () => {
    expect(canOpenPack(null, Date.now())).toBe(true);
  });

  it('blocks opening right after a pack was opened', () => {
    const now = 1_000_000_000_000;
    expect(canOpenPack(now, now)).toBe(false);
  });

  it('blocks opening a few seconds before the 12h window elapses', () => {
    const now = 1_000_000_000_000;
    const lastOpenedAt = now - PACK_COOLDOWN_MS + 5000;
    expect(canOpenPack(lastOpenedAt, now)).toBe(false);
  });

  it('allows opening exactly at the 12h boundary', () => {
    const now = 1_000_000_000_000;
    const lastOpenedAt = now - PACK_COOLDOWN_MS;
    expect(canOpenPack(lastOpenedAt, now)).toBe(true);
  });

  it('allows opening well after the 12h window elapses', () => {
    const now = 1_000_000_000_000;
    const lastOpenedAt = now - PACK_COOLDOWN_MS - 60_000;
    expect(canOpenPack(lastOpenedAt, now)).toBe(true);
  });
});

describe('msUntilNextPack', () => {
  it('is 0 when no pack has ever been opened', () => {
    expect(msUntilNextPack(null, Date.now())).toBe(0);
  });

  it('is 0 once the cooldown has elapsed', () => {
    const now = 1_000_000_000_000;
    expect(msUntilNextPack(now - PACK_COOLDOWN_MS - 1, now)).toBe(0);
  });

  it('counts down correctly mid-cooldown', () => {
    const now = 1_000_000_000_000;
    const lastOpenedAt = now - 1000;
    expect(msUntilNextPack(lastOpenedAt, now)).toBe(PACK_COOLDOWN_MS - 1000);
  });

  it('treats a lastOpenedAt from the future (e.g. device clock changed) as "just opened" rather than going negative', () => {
    const now = 1_000_000_000_000;
    expect(msUntilNextPack(now + 10_000, now)).toBe(PACK_COOLDOWN_MS + 10_000);
  });
});

describe('formatCountdown', () => {
  it('formats zero as 00:00:00', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
  });

  it('formats a full 12h window', () => {
    expect(formatCountdown(PACK_COOLDOWN_MS)).toBe('12:00:00');
  });

  it('formats an arbitrary duration with correct padding', () => {
    const ms = (1 * 3600 + 2 * 60 + 3) * 1000;
    expect(formatCountdown(ms)).toBe('01:02:03');
  });

  it('rounds up sub-second remainders so the countdown never shows a false 00:00:00', () => {
    expect(formatCountdown(500)).toBe('00:00:01');
  });
});
