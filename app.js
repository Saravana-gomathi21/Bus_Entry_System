const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bus-entry-monitor';

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const busRecordSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  status: { type: String, enum: ['Entry', 'Exit'], default: 'Entry' },
  timestamp: { type: Date, default: Date.now },
  driverName: { type: String },
  route: { type: String }
});

const BusRecord = mongoose.model('BusRecord', busRecordSchema);

app.get('/api/records', async (req, res) => {
  try {
    const records = await BusRecord.find().sort({ timestamp: -1 }).limit(50);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load records' });
  }
});

app.post('/api/record', async (req, res) => {
  try {
    const { plateNumber, status, driverName, route } = req.body;
    if (!plateNumber || !status) {
      return res.status(400).json({ error: 'Plate number and status are required.' });
    }

    const newRecord = new BusRecord({
      plateNumber: plateNumber.trim().toUpperCase(),
      status,
      driverName: driverName?.trim(),
      route: route?.trim()
    });

    await newRecord.save();
    res.json({ success: true, record: newRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const total = await BusRecord.countDocuments();
    const entries = await BusRecord.countDocuments({ status: 'Entry' });
    const exits = await BusRecord.countDocuments({ status: 'Exit' });
    res.json({ total, entries, exits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
