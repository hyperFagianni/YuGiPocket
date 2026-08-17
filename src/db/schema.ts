/**
 * SQLite schema for the local card cache, collection and app config.
 * Applied once via db/client.ts using `CREATE TABLE IF NOT EXISTS`, so it's
 * safe to run on every app start.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    frame_type TEXT NOT NULL,
    race TEXT,
    attribute TEXT,
    level_or_rank INTEGER,
    atk INTEGER,
    def INTEGER,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_url_small TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS card_sets (
    card_id INTEGER NOT NULL REFERENCES cards(id),
    set_id TEXT NOT NULL,
    rarity TEXT NOT NULL,
    PRIMARY KEY (card_id, set_id, rarity)
  );`,
  `CREATE INDEX IF NOT EXISTS idx_card_sets_set_rarity ON card_sets(set_id, rarity);`,
  `CREATE TABLE IF NOT EXISTS collection (
    card_id INTEGER NOT NULL REFERENCES cards(id),
    set_id TEXT NOT NULL,
    rarity TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    first_obtained_at INTEGER,
    PRIMARY KEY (card_id, set_id)
  );`,
  `CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );`,
];

export const CONFIG_KEYS = {
  lastPackOpenedAt: 'lastPackOpenedAt',
  ygoDbVersion: 'ygoDbVersion',
  seededSetIds: 'seededSetIds',
  tradeBoardNickname: 'tradeBoardNickname',
} as const;
