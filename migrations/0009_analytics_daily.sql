-- Anonymous first-party pageview aggregates. Never store IPs, user agents, cookies or raw referrers.
CREATE TABLE IF NOT EXISTS web_analytics_daily (
 day TEXT NOT NULL,
 path TEXT NOT NULL,
 channel TEXT NOT NULL CHECK(channel IN ('direct','search','social','referral','internal')),
 views INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(day,path,channel)
);
CREATE INDEX IF NOT EXISTS idx_analytics_day ON web_analytics_daily(day);
