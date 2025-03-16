document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const pdfUpload = document.getElementById('pdfUpload');
    const workspace = document.getElementById('workspace');
    const pageContainer = document.getElementById('pageContainer');
    const preview = document.getElementById('preview');
    const previewContainer = document.getElementById('previewContainer');
    const downloadLink = document.getElementById('downloadLink');
    const splitModal = document.getElementById('splitModal');
    const splitStart = document.getElementById('splitStart');
    const splitEnd = document.getElementById('splitEnd');
    const confirmSplit = document.getElementById('confirmSplit');
    const cancelSplit = document.getElementById('cancelSplit');

    let totalPages = 0;
    let currentSplitPage = 0;
    let pdfDocument = null;

    // ✅ Drag & Drop PDF Upload
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
        handleFile(file);
    });

    // ✅ Browse PDF Upload
    dropZone.querySelector('.browse-btn').addEventListener('click', () => pdfUpload.click());
    dropZone.addEventListener('click', () => pdfUpload.click());
    pdfUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // ✅ Handle File Upload
    async function handleFile(file) {
        if (!file || !file.type.match('pdf')) {
            alert('Please upload a valid PDF.');
            return;
        }
    
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            const pdfData = new Uint8Array(this.result);
            pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
            totalPages = pdfDocument.numPages;
            workspace.classList.remove('hidden');
            dropZone.style.display = 'none'; // ✅ Hide drop zone after upload
            renderPages();
        };
        fileReader.readAsArrayBuffer(file);
    }
    

    // ✅ Render PDF Pages in Workspace
    async function renderPages() {
        pageContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 210;
            canvas.height = 297;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            const pageItem = document.createElement('div');
            pageItem.className = 'page-item';
            pageItem.innerHTML = `
                <div class="page-number">Page ${i}</div>
                <i class="fas fa-cut split-icon" data-page="${i}"></i>
            `;
            pageItem.appendChild(canvas);

            pageContainer.appendChild(pageItem);

            // ✅ Show Large Image Preview on Click
            canvas.addEventListener('click', () => showLargePreview(canvas));
        }

        // ✅ Handle Split Icon Click
        document.querySelectorAll('.split-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                currentSplitPage = parseInt(icon.dataset.page);
                splitStart.value = currentSplitPage;
                splitEnd.value = currentSplitPage;
                splitStart.max = totalPages;
                splitEnd.max = totalPages;
                splitModal.style.display = 'flex';
            });
        });
    }

    // ✅ Show Large Preview with High Quality
    async function showLargePreview(canvas) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const pageNumber = parseInt(canvas.parentElement.querySelector('.page-number').textContent.replace('Page ', ''));
        const page = await pdfDocument.getPage(pageNumber);

        const viewport = page.getViewport({ scale: 2.0 }); // ✅ High resolution rendering

        const highQualityCanvas = document.createElement('canvas');
        const context = highQualityCanvas.getContext('2d');
        highQualityCanvas.width = viewport.width;
        highQualityCanvas.height = viewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        const largeImage = document.createElement('img');
        largeImage.src = highQualityCanvas.toDataURL();
        largeImage.className = 'large-preview';

        overlay.appendChild(largeImage);
        document.body.appendChild(overlay);

        // ✅ Remove overlay when clicking outside
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
    }


    // ✅ Cancel Split
    cancelSplit.addEventListener('click', () => {
        splitModal.style.display = 'none';
    });

    // ✅ Handle Confirm Split
    confirmSplit.addEventListener('click', async () => {
        const start = parseInt(splitStart.value);
        const end = parseInt(splitEnd.value);

        if (start < 1 || end > totalPages || start > end) {
            alert('Invalid page range.');
            return;
        }

        // ✅ Show Split Preview
        preview.classList.remove('hidden');
        previewContainer.innerHTML = '';

        for (let i = start; i <= end; i++) {
            const page = await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 210;
            canvas.height = 297;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // ✅ Show Page Number in Split Preview
            const pageItem = document.createElement('div');
            pageItem.className = 'preview-item';
            pageItem.innerHTML = `
                <div class="page-number">Page ${i}</div>
            `;
            pageItem.appendChild(canvas);

            previewContainer.appendChild(pageItem);
        }

        splitModal.style.display = 'none';
    });
});
