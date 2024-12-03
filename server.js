const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');
const db = require('./database');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(express.json());
// Add Event
app.post('/events', (req, res) => {
  const { title, description, time } = req.body;
  if (!title || !description || !time) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.addEvent({ title, description, time }, (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(event);
  });
});
// Get Events
app.get('/events', (req, res) => {
  db.getUpcomingEvents((err, events) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(events);
  });
});
// WebSocket Notification
wss.on('connection', (ws) => {
  console.log('WebSocket connected');
});
// Cron Job for Notifications
cron.schedule('* * * * *', () => {
  db.getUpcomingEvents((err, events) => {
    if (err) console.error('Cron job error:', err);
    const now = new Date();
    events.forEach((event) => {
      const eventTime = new Date(event.time);
      const timeDiff = (eventTime - now) / (1000 * 60); // in minutes
      if (timeDiff <= 5 && timeDiff > 0) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                notification: `Upcoming Event: ${event.title} in 5 minutes`,
                event,
              })
            );
          }
        });
      }
      if (timeDiff <= 0) {
        db.completeEvent(event.id, (err) => {
          if (err) console.error('Error completing event:', err);
          else {
            fs.appendFileSync(
              'completed_events.log',
              JSON.stringify(event) + '\n'
            );
          }
        });
      }
    });
  });
});
// Start Server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
