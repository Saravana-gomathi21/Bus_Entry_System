const camera = document.getElementById('camera');
const captureCanvas = document.getElementById('captureCanvas');
const startCamera = document.getElementById('startCamera');
const captureBtn = document.getElementById('captureBtn');
const plateNumberInput = document.getElementById('plateNumber');
const recordForm = document.getElementById('recordForm');
const feedback = document.getElementById('feedback');
const recordsTable = document.getElementById('recordsTable');
const totalCount = document.getElementById('total-count');
const entryCount = document.getElementById('entry-count');
const exitCount = document.getElementById('exit-count');

let stream = null;

async function startVideo() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    camera.srcObject = stream;
    camera.play();
  } catch (error) {
    feedback.textContent = 'Unable to start camera. Please allow camera access.';
  }
}

async function capturePlate() {
  if (!stream) {
    feedback.textContent = 'Start the camera first.';
    return;
  }

  const width = camera.videoWidth;
  const height = camera.videoHeight;
  captureCanvas.width = width;
  captureCanvas.height = height;
  const context = captureCanvas.getContext('2d');
  context.drawImage(camera, 0, 0, width, height);

  feedback.textContent = 'Scanning number plate...';
  const blob = await new Promise(resolve => captureCanvas.toBlob(resolve, 'image/jpeg'));

  try {
    const { data: { text } } = await Tesseract.recognize(blob, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          feedback.textContent = `Scanning number plate... ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    const detected = text.replace(/[^A-Z0-9-]/gi, '').toUpperCase().trim();
    if (detected.length >= 4) {
      plateNumberInput.value = detected;
      feedback.textContent = `Detected plate: ${detected}`;
    } else {
      feedback.textContent = 'Plate detection was not confident. Please enter it manually.';
    }
  } catch (error) {
    console.error(error);
    feedback.textContent = 'OCR failed, please enter the plate number manually.';
  }
}

async function loadRecords() {
  try {
    const res = await fetch('/api/records');
    const data = await res.json();
    recordsTable.innerHTML = data.length ? data.map(record => {
      const date = new Date(record.timestamp).toLocaleString();
      return `
        <tr>
          <td>${date}</td>
          <td>${record.plateNumber}</td>
          <td class="status-${record.status.toLowerCase()}">${record.status}</td>
          <td>${record.driverName || '-'}</td>
          <td>${record.route || '-'}</td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5">No records yet.</td></tr>';
  } catch (error) {
    recordsTable.innerHTML = '<tr><td colspan="5">Failed to load records.</td></tr>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    totalCount.textContent = stats.total ?? '--';
    entryCount.textContent = stats.entries ?? '--';
    exitCount.textContent = stats.exits ?? '--';
  } catch (error) {
    totalCount.textContent = '--';
    entryCount.textContent = '--';
    exitCount.textContent = '--';
  }
}

recordForm.addEventListener('submit', async event => {
  event.preventDefault();
  const payload = {
    plateNumber: plateNumberInput.value,
    status: document.getElementById('status').value,
    driverName: document.getElementById('driverName').value,
    route: document.getElementById('route').value
  };

  feedback.textContent = 'Saving record...';
  try {
    const res = await fetch('/api/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      feedback.textContent = 'Record saved successfully!';
      recordForm.reset();
      loadRecords();
      loadStats();
    } else {
      feedback.textContent = result.error || 'Unable to save record.';
    }
  } catch (error) {
    feedback.textContent = 'Server error while saving record.';
  }
});

startCamera.addEventListener('click', startVideo);
captureBtn.addEventListener('click', capturePlate);

loadRecords();
loadStats();
setInterval(loadStats, 10000);
