import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Use your MySQL username
  password: '',        // Use your MySQL password
  database: 'inventory_db',  // Replace with your actual database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

export default db;
