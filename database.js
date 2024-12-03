const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Create Table
db.serialize(() => {
  db.run(`CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    time DATETIME NOT NULL
  )`);
});

// Add Event
exports.addEvent = (event, callback) => {
  const { title, description, time } = event;
  const sql = 'INSERT INTO events (title, description, time) VALUES (?, ?, ?)';
  db.run(sql, [title, description, time], function (err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, ...event });
  });
};

// Get Upcoming Events
exports.getUpcomingEvents = (callback) => {
  const sql = 'SELECT * FROM events ORDER BY time ASC';
  db.all(sql, [], callback);
};

// Complete Event
exports.completeEvent = (id, callback) => {
  const sql = 'DELETE FROM events WHERE id = ?';
  db.run(sql, [id], callback);
};
