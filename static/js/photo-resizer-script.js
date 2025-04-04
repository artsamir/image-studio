document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const imageInput = document.getElementById('image');
    const originalPreviewContainer = document.getElementById('original-preview-container');
    const originalPreview = document.getElementById('original-preview');
    const originalImageInfo = document.getElementById('originalImageInfo');
    const resizedPreviewContainer = document.getElementById('resized-preview-container');
    const resizedPreview = document.getElementById('resized-preview');
    const resizedImageInfo = document.getElementById('resizedImageInfo');
    const submitBtn = document.getElementById('submitBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const spinner = submitBtn.querySelector('.spinner');
    let resizedBlob = null; // Store the resized image blob

    function showToast(message, isError = false) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : 'success'}`;
        
        toast.innerHTML = `
            <div class="toast-header">
                <strong>${isError ? 'Error' : 'Success'}</strong>
                <button class="toast-close">×</button>
            </div>
            <div>${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                showToast('Please select an image file', true);
                imageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                originalPreview.src = e.target.result;
                originalPreviewContainer.classList.remove('hidden');
                
                const img = new Image();
                img.onload = function() {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    originalImageInfo.textContent = `Size: ${sizeMB} MB | Dimensions: ${this.width}x${this.height}px`;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        submitBtn.disabled = true;
        spinner.classList.remove('hidden');
        
        try {
            const response = await fetch('/resize', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to resize image');
            }

            resizedBlob = await response.blob();
            const url = window.URL.createObjectURL(resizedBlob);
            resizedPreview.src = url;
            resizedPreviewContainer.classList.remove('hidden');
            downloadBtn.classList.remove('hidden');

            // Calculate and display resized image info
            const sizeKB = (resizedBlob.size / 1024).toFixed(2);
            const img = new Image();
            img.onload = function() {
                resizedImageInfo.textContent = `Size: ${sizeKB} KB | Dimensions: ${this.width}x${this.height}px`;
            };
            img.src = url;

            showToast('Image resized successfully!');
        } catch (error) {
            showToast(error.message, true);
        } finally {
            submitBtn.disabled = false;
            spinner.classList.add('hidden');
        }
    });

    downloadBtn.addEventListener('click', function() {
        if (resizedBlob) {
            const url = window.URL.createObjectURL(resizedBlob);
            const a = document.createElement('a');
            const originalFilename = imageInput.files[0].name.split('.').slice(0, -1).join('.');
            a.href = url;
            a.download = `${originalFilename}_resized.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Image downloaded successfully!');
        } else {
            showToast('No resized image available to download', true);
        }
    });
});