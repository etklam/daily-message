const Database = require('better-sqlite3');
const db = new Database('./data/database.sqlite');

try {
  const configs = db.prepare("SELECT * FROM system_config WHERE key LIKE 'openai_%'").all();
  console.log('Current AI configurations:');
  configs.forEach(config => {
    console.log(`${config.key}: ${config.key.includes('key') ? '[HIDDEN]' : config.value}`);
  });
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}