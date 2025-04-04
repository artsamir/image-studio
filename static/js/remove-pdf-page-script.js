document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const pdfUpload = document.getElementById('pdfUpload');
    const workspace = document.getElementById('workspace');
    const pageContainer = document.getElementById('pageContainer');
    const preview = document.getElementById('preview');
    const previewContainer = document.getElementById('previewContainer');
    const downloadLink = document.getElementById('downloadLink');
    const createNewPdfBtn = document.getElementById('createNewPdf');
    
    let pdfDocument = null;
    let totalPages = 0;
    let removedPages = new Set();

    // Drag & Drop PDF Upload
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
        handleFile(e.dataTransfer.files[0]);
    });

    dropZone.querySelector('.browse-btn').addEventListener('click', () => pdfUpload.click());
    dropZone.addEventListener('click', () => pdfUpload.click());
    pdfUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));

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
            dropZone.style.display = 'none';
            renderPages();
            createNewPdfBtn.classList.remove('hidden');
        };
        fileReader.readAsArrayBuffer(file);
    }

    async function renderPages() {
        pageContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 210;
            canvas.height = 297;

            await page.render({ canvasContext: context, viewport }).promise;

            const pageItem = document.createElement('div');
            pageItem.className = 'page-item';
            pageItem.innerHTML = `
                <div class="page-number">Page ${i}</div>
                <i class="fas fa-trash delete-icon" data-page="${i}"></i>
            `;
            pageItem.appendChild(canvas);
            pageContainer.appendChild(pageItem);

            pageItem.querySelector('.delete-icon').addEventListener('click', () => {
                const pageNum = parseInt(pageItem.querySelector('.delete-icon').dataset.page);
                if (removedPages.has(pageNum)) {
                    removedPages.delete(pageNum);
                    pageItem.classList.remove('removed');
                } else {
                    removedPages.add(pageNum);
                    pageItem.classList.add('removed');
                }
            });
        }
    }

    createNewPdfBtn.addEventListener('click', async () => {
        if (removedPages.size === totalPages) {
            alert('Cannot remove all pages!');
            return;
        }

        preview.classList.remove('hidden');
        previewContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            if (!removedPages.has(i)) {
                const page = await pdfDocument.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 210;
                canvas.height = 297;

                await page.render({ canvasContext: context, viewport }).promise;

                const pageItem = document.createElement('div');
                pageItem.className = 'preview-item';
                pageItem.innerHTML = `<div class="page-number">Page ${i}</div>`;
                pageItem.appendChild(canvas);
                previewContainer.appendChild(pageItem);
            }
        }

        // Send request to backend to create new PDF
        const response = await fetch('/remove_pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ removed_pages: Array.from(removedPages) })
        });

        if (response.ok) {
            const data = await response.json();
            downloadLink.href = data.download_url;
            downloadLink.classList.remove('hidden');
        }
    });
});