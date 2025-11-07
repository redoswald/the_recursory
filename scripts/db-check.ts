import Database from 'better-sqlite3';
import { join } from 'path';
import bcrypt from 'bcryptjs';

const dbPath = join(process.cwd(), 'data.db');
const db = new Database(dbPath);

console.log('Database path:', dbPath);
console.log('\n=== USERS ===');
const users = db.prepare('SELECT id, email, name, created_at FROM users').all();
console.log('Total users:', users.length);
users.forEach((user: any) => {
  console.log(`- ${user.email} (${user.name || 'No name'}) - Created: ${user.created_at}`);
});

console.log('\n=== ARTICLES ===');
const articles = db.prepare('SELECT id, title, user_id FROM articles').all();
console.log('Total articles:', articles.length);
articles.forEach((article: any) => {
  console.log(`- ${article.title} (User: ${article.user_id})`);
});

// Test password verification if you provide credentials
const testEmail = process.argv[2];
const testPassword = process.argv[3];

if (testEmail && testPassword) {
  console.log(`\n=== TESTING LOGIN FOR ${testEmail} ===`);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(testEmail) as any;

  if (!user) {
    console.log('❌ User not found');
  } else {
    console.log('✓ User found');
    console.log('User ID:', user.id);
    console.log('Password hash in DB:', user.password.substring(0, 20) + '...');

    bcrypt.compare(testPassword, user.password).then((isValid) => {
      if (isValid) {
        console.log('✓ Password matches!');
      } else {
        console.log('❌ Password does not match');
      }
    });
  }
}

db.close();
