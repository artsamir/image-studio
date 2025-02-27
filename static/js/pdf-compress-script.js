const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const dropText = document.getElementById('drop-text');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const preview = document.getElementById('preview');
const pdfPreview = document.getElementById('pdf-preview');
const options = document.getElementById('options');
const compressBtn = document.getElementById('compress-btn');
const dpiSelect = document.getElementById('dpi');
const targetSizeInput = document.getElementById('target-size');
const result = document.getElementById('result');
const originalSize = document.getElementById('original-size');
const compressedSize = document.getElementById('compressed-size');
const downloadBtn = document.getElementById('download-btn');
const processing = document.getElementById('processing');

let uploadedFilename = null;

dropZone.addEventListener('click', () => {
    console.log("Drop zone clicked");
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    console.log("File dropped:", file ? file.name : "No file");
    if (file) uploadFile(file);
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    console.log("File selected:", file ? file.name : "No file");
    if (file) uploadFile(file);
});

function uploadFile(file) {
    console.log("Uploading file:", file.name);
    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || `HTTP error: ${response.status}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log("Upload response data:", data);
        if (data.error) {
            alert(data.error);
            return;
        }
        uploadedFilename = data.filename;
        fileName.textContent = data.filename;
        fileSize.textContent = data.file_size;
        dropText.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        options.classList.remove('hidden');
        result.classList.add('hidden');

        // Show original file preview
        const previewUrl = URL.createObjectURL(file);
        pdfPreview.src = previewUrl;
        preview.classList.remove('hidden');
    })
    .catch(error => {
        console.error('Upload Error:', error.message);
        alert(`Upload failed: ${error.message}`);
    });
}

compressBtn.addEventListener('click', () => {
    if (!uploadedFilename) {
        alert('Please upload a file first!');
        return;
    }

    processing.classList.remove('hidden');
    result.classList.add('hidden');

    const data = {
        filename: uploadedFilename,
        dpi: dpiSelect.value,
        target_size: targetSizeInput.value || null
    };

    fetch('/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || `HTTP error: ${response.status}`); });
        }
        return response.json();
    })
    .then(data => {
        processing.classList.add('hidden');
        if (data.error) {
            alert(data.error);
            return;
        }
        originalSize.textContent = data.original_size;
        compressedSize.textContent = data.compressed_size;
        result.classList.remove('hidden');
        downloadBtn.onclick = () => window.location.href = data.download_path;

        // Show compressed file preview
        const compressedPreviewUrl = `${window.location.origin}${data.download_path}`;
        pdfPreview.src = compressedPreviewUrl;
        preview.classList.remove('hidden');
    })
    .catch(error => {
        processing.classList.add('hidden');
        console.error('Compression Error:', error.message);
        alert(`Compression failed: ${error.message}`);
    });
});