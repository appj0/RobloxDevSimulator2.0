window.GLOBAL_DATA_CONFIG = {
  // Set provider to "supabase" to enable global leaderboard data.
  provider: "supabase",
  // Example: "https://YOUR_PROJECT_ID.supabase.co"
  supabaseUrl: "https://gzixmlkymxzrwtfoyztg.supabase.co",
  // Supabase anon/public key.
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aXhtbGt5bXh6cnd0Zm95enRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDE1OTEsImV4cCI6MjA4NjcxNzU5MX0.lbSgtmO7hIf6rYtCmojvGE_lorUaJR0uAiOgoMzwKzQ",
  // Table name that stores leaderboard rows.
  table: "leaderboard_runs",
  // Global hard reset point (Unix ms). Records before this are ignored.
  leaderboardResetAfter: 1763251200000
};
