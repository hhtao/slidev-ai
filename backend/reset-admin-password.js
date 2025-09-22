const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
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

async function resetAdminPassword() {
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('Resetting admin password to:', newPassword);
    console.log('Hashed password:', hashedPassword);
    
    db.run("UPDATE users SET password = ? WHERE username = 'admin'", [hashedPassword], function(err) {
        if (err) {
            console.error('Error updating password:', err.message);
            return;
        }
        
        console.log(`Password updated for admin user. Rows changed: ${this.changes}`);
        
        // Verify the update
        db.get("SELECT username, password FROM users WHERE username = 'admin'", (err, row) => {
            if (err) {
                console.error('Error verifying update:', err.message);
                return;
            }
            
            console.log('Updated admin user password hash:', row.password);
            
            // Test the password
            bcrypt.compare(newPassword, row.password, (err, result) => {
                if (err) {
                    console.error('Error testing password:', err.message);
                    return;
                }
                
                console.log('Password test result:', result ? 'SUCCESS' : 'FAILED');
                db.close();
            });
        });
    });
}

resetAdminPassword().catch(console.error);