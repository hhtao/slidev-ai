const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database.');
});

// Check if users table exists and get admin user
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users';", (err, rows) => {
    if (err) {
        console.error('Error checking tables:', err.message);
        return;
    }
    
    if (rows.length === 0) {
        console.log('Users table does not exist yet.');
        db.close();
        return;
    }
    
    console.log('Users table exists. Checking admin user...');
    
    // Get admin user details
    db.all("SELECT id, username, email, role FROM users WHERE username = 'admin';", (err, users) => {
        if (err) {
            console.error('Error querying users:', err.message);
            return;
        }
        
        if (users.length === 0) {
            console.log('No admin user found.');
        } else {
            console.log('Admin user found:', users[0]);
        }
        
        db.close();
    });
});