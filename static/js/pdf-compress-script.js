const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const dropText = document.getElementById('drop-text');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const originalPreview = document.getElementById('original-preview');
const originalPdfPreview = document.getElementById('original-pdf-preview');
const options = document.getElementById('options');
const compressBtn = document.getElementById('compress-btn');
const dpiSelect = document.getElementById('dpi');
const targetSizeInput = document.getElementById('target-size');
const compressedPreview = document.getElementById('compressed-preview');
const compressedPdfPreview = document.getElementById('compressed-pdf-preview');
const compressedFileName = document.getElementById('compressed-file-name');
const compressedSize = document.getElementById('compressed-size');
const downloadBtn = document.getElementById('download-btn');
const processing = document.getElementById('processing');

let uploadedFilename = null;
let compressedFileUrl = null;

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
        compressedPreview.classList.add('hidden');

        const previewUrl = URL.createObjectURL(file);
        originalPdfPreview.src = previewUrl;
        originalPreview.classList.remove('hidden');
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
    compressedPreview.classList.add('hidden');

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
        console.log('Response status:', response.status);
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || `HTTP error: ${response.status}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Compression response:', data);
        processing.classList.add('hidden');
        if (data.error) {
            alert(data.error);
            return;
        }
        
        compressedFileName.textContent = 'compressed_' + uploadedFilename;
        compressedSize.textContent = data.compressed_size;
        // Use ?as_attachment=false for preview
        compressedFileUrl = `${window.location.origin}${data.download_path}?as_attachment=false`;
        compressedPdfPreview.src = compressedFileUrl;
        compressedPreview.classList.remove('hidden');
        originalPreview.classList.remove('hidden');
    })
    .catch(error => {
        processing.classList.add('hidden');
        console.error('Compression Error:', error.message);
        alert(`Compression failed: ${error.message}`);
    });
});

downloadBtn.addEventListener('click', () => {
    if (compressedFileUrl) {
        // Use ?as_attachment=true for download
        const downloadUrl = compressedFileUrl.replace('as_attachment=false', 'as_attachment=true');
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'compressed_' + uploadedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});