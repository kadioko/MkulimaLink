const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Migration model to track applied migrations
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now }
});

const Migration = mongoose.model('Migration', migrationSchema);

// Migrations directory
const migrationsDir = path.join(__dirname, '../migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Connect to database
async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mkulimalink');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Get all migration files
function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();
}

// Get pending migrations
async function getPendingMigrations() {
  const appliedMigrations = await Migration.find().select('name');
  const appliedNames = new Set(appliedMigrations.map(m => m.name));
  
  return getMigrationFiles().filter(file => !appliedNames.has(file));
}

// Run migrations
async function migrate() {
  await connect();
  
  const pending = await getPendingMigrations();
  
  if (pending.length === 0) {
    console.log('No pending migrations');
    process.exit(0);
  }
  
  console.log(`Found ${pending.length} pending migration(s)`);
  
  for (const file of pending) {
    console.log(`Running migration: ${file}`);
    
    try {
      const migration = require(path.join(migrationsDir, file));
      
      if (typeof migration.up !== 'function') {
        throw new Error(`Migration ${file} does not export an 'up' function`);
      }
      
      await migration.up(mongoose);
      await Migration.create({ name: file });
      
      console.log(`✓ Migration ${file} completed`);
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully');
  process.exit(0);
}

// Rollback last migration
async function rollback() {
  await connect();
  
  const lastMigration = await Migration.findOne().sort({ appliedAt: -1 });
  
  if (!lastMigration) {
    console.log('No migrations to rollback');
    process.exit(0);
  }
  
  const file = lastMigration.name;
  console.log(`Rolling back migration: ${file}`);
  
  try {
    const migration = require(path.join(migrationsDir, file));
    
    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${file} does not export a 'down' function`);
    }
    
    await migration.down(mongoose);
    await Migration.deleteOne({ name: file });
    
    console.log(`✓ Rollback of ${file} completed`);
  } catch (error) {
    console.error(`✗ Rollback of ${file} failed:`, error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Create new migration
function create(name) {
  if (!name) {
    console.error('Please provide a migration name');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.js`;
  const filepath = path.join(migrationsDir, filename);
  
  const template = `/**
 * Migration: ${name}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  /**
   * Run the migration
   * @param {import('mongoose')} mongoose
   */
  async up(mongoose) {
    const db = mongoose.connection.db;
    
    // Your migration code here
    // Example: await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
  },

  /**
   * Reverse the migration
   * @param {import('mongoose')} mongoose
   */
  async down(mongoose) {
    const db = mongoose.connection.db;
    
    // Your rollback code here
    // Example: await db.collection('users').updateMany({}, { $unset: { newField: '' } });
  }
};
`;
  
  fs.writeFileSync(filepath, template);
  console.log(`Created migration: ${filename}`);
  process.exit(0);
}

// Show migration status
async function status() {
  await connect();
  
  const applied = await Migration.find().sort({ appliedAt: 1 });
  const allFiles = getMigrationFiles();
  const appliedNames = new Set(applied.map(m => m.name));
  
  console.log('\nMigration Status:');
  console.log('─'.repeat(60));
  
  for (const file of allFiles) {
    const migration = applied.find(m => m.name === file);
    if (migration) {
      console.log(`✓ ${file} (applied: ${migration.appliedAt.toISOString()})`);
    } else {
      console.log(`○ ${file} (pending)`);
    }
  }
  
  console.log('─'.repeat(60));
  console.log(`Total: ${allFiles.length} | Applied: ${applied.length} | Pending: ${allFiles.length - applied.length}`);
  
  process.exit(0);
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'up':
  case 'migrate':
    migrate();
    break;
  case 'down':
  case 'rollback':
    rollback();
    break;
  case 'create':
  case 'new':
    create(arg);
    break;
  case 'status':
    status();
    break;
  default:
    console.log(`
MkulimaLink Database Migration Tool

Usage:
  node migrate.js <command> [options]

Commands:
  migrate, up     Run all pending migrations
  rollback, down  Rollback the last migration
  create, new     Create a new migration file
  status          Show migration status

Examples:
  node migrate.js migrate
  node migrate.js rollback
  node migrate.js create "add user preferences"
  node migrate.js status
    `);
    process.exit(0);
}



