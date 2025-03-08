const drop1 = document.getElementById('drop1');
const drop2 = document.getElementById('drop2');
const image1 = document.getElementById('image1');
const image2 = document.getElementById('image2');
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const previewImg1 = document.getElementById('previewImg1');
const previewImg2 = document.getElementById('previewImg2');
const loader1 = document.getElementById('loader1');
const loader2 = document.getElementById('loader2');
const combineBtn = document.getElementById('combineBtn');
const outputImage = document.getElementById('outputImage');
const resultPreview = document.getElementById('resultPreview');
const downloadBtn = document.getElementById('downloadBtn');

// Handle drag and drop events
[drop1, drop2].forEach((drop, index) => {
    drop.addEventListener('dragover', (e) => e.preventDefault());
    drop.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file, index);
    });
    drop.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById(`image${index + 1}`).click();
    });
});

// Handle file input change
[image1, image2].forEach((input, index) => {
    input.addEventListener('change', (e) => {
        e.stopPropagation();
        const file = e.target.files[0];
        if (file) {
            handleFile(file, index);
            input.value = ''; // Reset input to allow re-upload of same file
        }
    });
});

async function handleFile(file, index) {
    const preview = index === 0 ? preview1 : preview2;
    const previewImg = index === 0 ? previewImg1 : previewImg2;
    const loader = index === 0 ? loader1 : loader2;
    const drop = index === 0 ? drop1 : drop2;

    drop.style.display = 'none';
    preview.style.display = 'block';
    loader.style.display = 'block';

    const reader = new FileReader();
    reader.onload = (e) => previewImg.src = e.target.result;
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/remove-bg', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error(`Background removal failed: ${response.statusText}`);
        const blob = await response.blob();
        previewImg.src = URL.createObjectURL(blob);
        loader.style.display = 'none';
        if (preview1.style.display === 'block' && preview2.style.display === 'block') {
            combineBtn.style.display = 'block';
            combineBtn.disabled = false; // Ensure it's enabled
        }
    } catch (error) {
        console.error('Error removing background:', error);
        loader.style.display = 'none';
        alert('Failed to process image. Please try again.');
        drop.style.display = 'block'; // Show drop area again on failure
        preview.style.display = 'none';
    }
}

async function combineImages() {
    const formData = new FormData();
    
    // Convert preview images back to blobs before sending
    const blob1 = await fetch(previewImg1.src).then(res => res.blob());
    const blob2 = await fetch(previewImg2.src).then(res => res.blob());

    // Append them as files to FormData
    formData.append('image1', new File([blob1], 'image1.png', { type: 'image/png' }));
    formData.append('image2', new File([blob2], 'image2.png', { type: 'image/png' }));

    try {
        const response = await fetch('/combine-images', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error(`Image combination failed: ${response.statusText}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        outputImage.src = url;
        resultPreview.style.display = 'block';
        downloadBtn.style.display = 'block';
        console.log('✅ Combined image loaded successfully');
    } catch (error) {
        console.error('❌ Error combining images:', error);
        alert('Failed to combine images. Please try again.');
    }
}


function downloadImage() {
    const link = document.createElement('a');
    link.href = outputImage.src;
    link.download = 'passport_size_image.png';
    link.click();
}

function dataURLtoBlob(dataURL) {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mime });
}