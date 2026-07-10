# College Bus Entry Monitor

A green-themed web app for college bus entry/exit monitoring using HTML, CSS, Node.js, and MongoDB.

## Features
- Live camera capture for number plate scanning with Tesseract.js OCR
- Save bus entry/exit records to MongoDB
- Dashboard with total, entry, and exit statistics
- Recent activity table with timestamped records

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run MongoDB locally or configure `MONGO_URI`:
   ```bash
   set MONGO_URI=mongodb://127.0.0.1:27017/bus-entry-monitor
   ```
3. Start the app:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.

## Notes
- The camera scan uses browser camera access and Tesseract.js OCR. For best results, allow camera access and capture clear number plates.
- If OCR fails, you can manually enter the plate number and save the record.
