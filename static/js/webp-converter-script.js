const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const convertBtn = document.getElementById('convertBtn');
const convertedPreview = document.getElementById('convertedPreview');
const downloadBtn = document.getElementById('downloadBtn');
const processingOverlay = document.getElementById('processingOverlay');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
let uploadedFiles = [];
let convertedFiles = [];
let activeLargeView = null;

dropZone.addEventListener('click', () => fileInput.click());

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
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).slice(0, 300 - uploadedFiles.length);
    uploadedFiles = [...uploadedFiles, ...newFiles];
    
    if (uploadedFiles.length > 300) {
        uploadedFiles = uploadedFiles.slice(0, 300);
        alert('Maximum limit of 300 files reached');
    }
    
    renderUploadPreview();
    convertBtn.disabled = uploadedFiles.length === 0;
    downloadBtn.disabled = true;
}

function renderUploadPreview() {
    uploadPreview.innerHTML = '';
    uploadedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'upload-item';
            div.innerHTML = `
                <img src="${e.target.result}">
                <span>${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
            `;
            uploadPreview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

function simulateProgress() {
    let progress = 0;
    const maxProgress = 80; // Stop at 80%
    const intervalTime = 500; // Update every 500ms for gradual filling
    let interval;

    return new Promise((resolve) => {
        interval = setInterval(() => {
            if (progress < maxProgress) {
                progress += 2; // Increment by 2% for smooth, gradual filling
                if (progress > maxProgress) progress = maxProgress; // Cap at 80%
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            }
        }, intervalTime);

        // Resolve when called to finish
        resolve(() => {
            clearInterval(interval);
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
        });
    });
}

convertBtn.addEventListener('click', async () => {
    const formData = new FormData();
    uploadedFiles.forEach(file => {
        formData.append('images', file);
    });

    try {
        // Show processing overlay and start progress simulation
        processingOverlay.style.display = 'flex';
        const finishProgress = await simulateProgress();

        const response = await fetch('/convert-to-webp', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Conversion failed');

        const blob = await response.blob();
        convertedFiles = [];
        convertedPreview.innerHTML = '';

        const zip = await JSZip.loadAsync(blob);
        await Promise.all(Object.entries(zip.files).map(async ([filename, file]) => {
            const fileBlob = await file.async('blob');
            const convertedFile = new File([fileBlob], filename, { type: 'image/webp' });
            convertedFiles.push(convertedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'grid-item';
                div.innerHTML = `
                    <img src="${e.target.result}">
                    <img class="large-view" src="${e.target.result}">
                `;
                convertedPreview.appendChild(div);

                const img = div.querySelector('img:not(.large-view)');
                const largeView = div.querySelector('.large-view');
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (activeLargeView && activeLargeView !== largeView) {
                        activeLargeView.style.display = 'none';
                    }
                    largeView.style.display = largeView.style.display === 'block' ? 'none' : 'block';
                    activeLargeView = largeView.style.display === 'block' ? largeView : null;
                });
            };
            reader.readAsDataURL(convertedFile);
        }));

        // Finish progress and hide overlay
        finishProgress();
        setTimeout(() => {
            processingOverlay.style.display = 'none';
            progressFill.style.width = '0%'; // Reset for next use
            progressText.textContent = '0%';
        }, 500); // Brief delay to show 100%

        document.addEventListener('click', (e) => {
            if (activeLargeView && !e.target.closest('.grid-item')) {
                activeLargeView.style.display = 'none';
                activeLargeView = null;
            }
        });

        downloadBtn.disabled = false;
    } catch (error) {
        console.error('Error:', error);
        alert('Conversion failed');
        processingOverlay.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
    }
});

downloadBtn.addEventListener('click', () => {
    if (convertedFiles.length === 1) {
        const file = convertedFiles[0];
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
    } else if (convertedFiles.length > 1) {
        const zip = new JSZip();
        convertedFiles.forEach(file => {
            zip.file(file.name, file);
        });
        
        zip.generateAsync({ type: 'blob' }).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'converted_images.zip';
            link.click();
        });
    }
});