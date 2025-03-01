async function combineImages() {
    const image1 = document.getElementById('image1').files[0];
    const image2 = document.getElementById('image2').files[0];
    
    if (!image1 || !image2) {
        alert('Please upload both images!');
        return;
    }

    const formData = new FormData();
    formData.append('image1', image1);
    formData.append('image2', image2);

    try {
        const response = await fetch('/combine', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            document.getElementById('outputImage').src = url;
        } else {
            alert('Error combining images');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}