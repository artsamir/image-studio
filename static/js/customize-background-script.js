function toggleMenu() {
    const navLinks = document.querySelector(".nav-links");
    const menuIcon = document.querySelector(".menu-icon i");
    const overlay = document.getElementById('overlay'); //new

    navLinks.classList.toggle("active");
    overlay.classList.toggle('active'); //new

    // Change icon based on active state
    // if (navLinks.classList.contains("active")) {
    //     menuIcon.classList.remove("fa-bars"); // Remove hamburger icon
    //     menuIcon.classList.add("fa-times"); // Add close icon
    // } else {
    //     menuIcon.classList.remove("fa-times"); // Remove close icon
    //     menuIcon.classList.add("fa-bars"); // Add hamburger icon
    // }
}

// Close sidebar when clicking outside
document.addEventListener('click', function (e) {
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.querySelector('.menu-icon');

    if (!navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
    }
});

// Toggle search box
document.addEventListener('DOMContentLoaded', function () {
    const searchIcon = document.getElementById('search-icon');
    const searchBox = document.getElementById('search-box');
    const fileInput = document.getElementById("fileInput");
    const dropArea = document.getElementById("drop-area");
    const previewImage = document.getElementById("preview-image");
    const loader = document.getElementById("loader");
    const removeBgBtn = document.getElementById("remove-bg-btn");
    const downloadBtn = document.getElementById("download-btn");
    const previewContainer = document.getElementById('preview-container');
    const magnifierBtn = document.getElementById('magnifier-btn');
    const bgImageOptions = document.getElementById('bg-image-options');    

    // For color select validation
    const bgColorBtn = document.querySelector('bg-color-btn');
    const bgColorOptions = document.getElementById('bg-color-options');
    const mixColor = document.getElementById('mixColor');
    const colorPicker = document.getElementById('colorPicker');
    const colorOptionsContainer = document.createElement('div');
    const addColorBtn = document.getElementById("bg-color-btn");
    const colorOptions = document.getElementById("bg-color-options");
    // const colorOptions = document.getElementById("color-options");
    const colorItems = document.querySelectorAll(".color-item");
    const mixColorBtn = document.getElementById("mixColor");
    const closeBtn = document.getElementById('close-color-options');


    colorOptionsContainer.id = 'color-options-container';
    colorOptionsContainer.style.display = 'none';
    colorOptionsContainer.style.position = 'absolute';
    colorOptionsContainer.style.background = 'white';
    colorOptionsContainer.style.border = '1px solid #ccc';
    colorOptionsContainer.style.padding = '10px';
    colorOptionsContainer.style.zIndex = '1001'; // Ensure it's above other elements

    

    document.body.appendChild(colorOptionsContainer);


    let isMagnifierEnabled = false;
    // For zoom effect start validation
    let scale = 1;
    const zoomIncrement = 0.1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX, startY;

    // End validation zoom effect 
    searchIcon.addEventListener('click', function () {
        searchBox.classList.toggle('active');
        if (searchBox.classList.contains('active')) {
            searchBox.focus();
        }
    });

    // Submenu functionality
    const hasSubmenu = document.querySelectorAll('.has-submenu');

    hasSubmenu.forEach(item => {
        const parentLink = item.querySelector('a'); // Get the parent link

        parentLink.addEventListener('click', function (e) {
            // Check if the click is on the parent link (not a submenu item)
            if (window.innerWidth <= 968) { // Only for mobile view
                e.preventDefault(); // Prevent default only for parent links
                item.classList.toggle('active');
            }
        });
    });

    // Zomm handle -----------------------------
    document.getElementById('zoom-in-btn').addEventListener('click', () => {
        scale += zoomIncrement;
        previewImage.style.transform = `scale(${scale})`;
    });

    document.getElementById('zoom-out-btn').addEventListener('click', () => {
        scale -= zoomIncrement;
        if (scale < 1) scale = 1;
        previewImage.style.transform = `scale(${scale})`;
    });

    previewImage.addEventListener('mousedown', (e) => {
        if (scale > 1) { // Only allow dragging if zoomed in
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            previewImage.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        previewImage.style.left = `${translateX}px`;
        previewImage.style.top = `${translateY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        previewImage.style.cursor = 'grab';
    });

    previewImage.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            previewImage.style.cursor = 'grab';
        }
    });

    previewImage.addEventListener('dblclick', () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        previewImage.style.transform = `scale(${scale})`;
        previewImage.style.left = '0px';
        previewImage.style.top = '0px';
    });
    
    // Handle Drag & Drop
    dropArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropArea.classList.add("drag-over");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("drag-over");
    });

    dropArea.addEventListener("drop", (event) => {
        event.preventDefault();
        dropArea.classList.remove("drag-over");
        const file = event.dataTransfer.files[0];
        handleFile(file);
    });

    // Handle File Selection
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function() {
                    let width = img.width;
                    let height = img.height;
    
                    adjustPreviewSize(width, height); // Call the updated function
    
                    previewImage.src = e.target.result;
                    previewImage.classList.remove("hidden");
                    previewContainer.classList.remove("hidden");
                    removeBgBtn.disabled = false;
                }
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
        
    function adjustPreviewSize(width, height) {
        const previewContainer = document.getElementById('preview-container');
        const screenWidth = window.innerWidth;
    
        if (screenWidth >= 1440) {
            if (height > width) {
                previewContainer.style.width = '378px';
                previewContainer.style.height = '576px';
            } else {
                previewContainer.style.width = '864px';
                previewContainer.style.height = '455px';
            }
        } else if (screenWidth >= 1240) {
            if (height > width) {
                previewContainer.style.width = '378px';
                previewContainer.style.height = '576px';
            } else {
                previewContainer.style.width = '663px';
                previewContainer.style.height = '350px';
            }
        } else if (screenWidth >= 970) {
            if (height > width) {
                previewContainer.style.width = '328px';
                previewContainer.style.height = '476px';
            } else {
                previewContainer.style.width = '532px';
                previewContainer.style.height = '289px';
            }
        } else if (screenWidth >= 768) {
            if (height > width) {
                previewContainer.style.width = '328px';
                previewContainer.style.height = '476px';
            } else {
                previewContainer.style.width = '490px';
                previewContainer.style.height = '289px';
            }
        } else if (screenWidth >= 577) {
            if (height > width) {
                previewContainer.style.width = '328px';
                previewContainer.style.height = '476px';
            } else {
                previewContainer.style.width = '478px';
                previewContainer.style.height = '289px';
            }
        } else if (screenWidth >= 430) {
            if (height > width) {
                previewContainer.style.width = '300px';
                previewContainer.style.height = '436px';
            } else {
                previewContainer.style.width = '313px';
                previewContainer.style.height = '189px';
            }
        } else if (screenWidth >= 366) {
            if (height > width) {
                previewContainer.style.width = '268px';
                previewContainer.style.height = '436px';
            } else {
                previewContainer.style.width = '289px';
                previewContainer.style.height = '189px';
            }
        } else if (screenWidth >= 313) {
            if (height > width) {
                previewContainer.style.width = '238px';
                previewContainer.style.height = '436px';
            } else {
                previewContainer.style.width = '159px';
                previewContainer.style.height = '89px';
            }
        } else { // Handle screenWidth < 313
            if (height > width) {
                previewContainer.style.width = '138px';
                previewContainer.style.height = '476px';
            } else {
                previewContainer.style.width = '159px';
                previewContainer.style.height = '89px';
            }
        }
    }

    magnifierBtn.addEventListener('click', function () {
        isMagnifierEnabled = !isMagnifierEnabled; // Toggle magnifier state
        magnifierBtn.classList.toggle('active', isMagnifierEnabled); // Toggle button active state
    });

    // Magnifying glass effect
    const magnifier = document.createElement('div');
    magnifier.classList.add('magnifier');
    previewContainer.appendChild(magnifier);

    previewContainer.addEventListener('mousemove', function (e) {
        if (!isMagnifierEnabled) {
            magnifier.style.display = 'none'; // Hide magnifier if not enabled
            return;
        }

        const rect = previewContainer.getBoundingClientRect();
        const x = e.clientX - rect.left; // X position relative to the preview box
        const y = e.clientY - rect.top; // Y position relative to the preview box

        // Ensure the magnifier stays within the preview box
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            magnifier.style.display = 'none';
            return;
        }

        // Set magnifier position
        magnifier.style.left = `${x - 75}px`; // Center the magnifier on the cursor
        magnifier.style.top = `${y - 75}px`;
        magnifier.style.display = 'block';

        // Set magnifier background
        const bgX = (x / rect.width) * 100;
        const bgY = (y / rect.height) * 100;
        magnifier.style.backgroundImage = `url('${previewImage.src}')`;
        magnifier.style.backgroundPosition = `${bgX}% ${bgY}%`;
    });

    previewContainer.addEventListener('mouseleave', function () {
        magnifier.style.display = 'none';
    });

    // Remove Background Button Click
    removeBgBtn.addEventListener("click", async () => {
        if (!fileInput.files[0]) return;

        loader.classList.remove("hidden"); // Show loader
        previewImage.classList.add("hidden"); // Hide current preview

        const formData = new FormData();
        formData.append("image", fileInput.files[0]);

        try {
            const response = await fetch("/remove-bg", {
                method: "POST",
                body: formData
            });

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            // Show processed image inside the same preview box (300x500)
            previewImage.src = imageUrl;
            previewImage.classList.remove("hidden");
            loader.classList.add("hidden"); // Hide loader

            // Enable download button
            downloadBtn.href = imageUrl;
            downloadBtn.classList.remove("hidden");
        } catch (error) {
            console.error("Error:", error);
            loader.classList.add("hidden");
        }
    });


    // Background customize option - color, background
    function hideOptions(event) {
        if (!event.target.closest('#bg-image-options') && bgImageOptions.style.display === 'block') {
            bgImageOptions.style.display = 'none';
        }
        if (!event.target.closest('#bg-color-options') && bgColorOptions.style.display === 'block') {
            bgColorOptions.style.display = 'none';
        }
    }

    document.getElementById('bg-image-btn').addEventListener('click', () => {
        bgImageOptions.style.display = 'block';
        bgColorOptions.style.display = 'none';
    });

    document.getElementById('bg-color-btn').addEventListener('click', () => {
        colorOptionsContainer.style.display = 'block';
        bgImageOptions.style.display = 'none';
    });

    document.querySelectorAll('.bg-option').forEach(option => {
        option.addEventListener('click', () => {
            const bg = option.dataset.bg;
            previewContainer.style.backgroundImage = `url('site-images/background/${bg}')`;
            previewContainer.style.backgroundSize = 'cover';
            previewContainer.style.backgroundRepeat = 'no-repeat';
            previewContainer.style.backgroundColor = '';
            bgImageOptions.style.display = 'none';
    
            // draw background image to canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const bgImg = new Image();
            bgImg.onload = function() {
                canvas.width = previewContainer.offsetWidth;
                canvas.height = previewContainer.offsetHeight;
                ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
                const previewImg = new Image();
                previewImg.onload = function(){
                    ctx.drawImage(previewImg,0,0, canvas.width, canvas.height);
                    previewImage.src = canvas.toDataURL('image/png');
                }
                previewImg.src = previewImage.src;
            }
            bgImg.src = `site-images/background/${bg}`;
    
        });
    });

    
    downloadBtn.addEventListener('click', function(event) {
        event.preventDefault();
    
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
    
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
    
            // Apply background color or image FIRST
            if (previewContainer.style.backgroundColor) {
                ctx.fillStyle = previewContainer.style.backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else if (previewContainer.style.backgroundImage) {
                const bgImg = new Image();
                bgImg.onload = function() {
                    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
    
                    const dataURL = canvas.toDataURL('image/png');
    
                    const a = document.createElement('a');
                    a.href = dataURL;
                    a.download = 'processed.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
                // Extract the URL from the backgroundImage style
                const url = previewContainer.style.backgroundImage.slice(4, -1).replace(/"/g, "");
                bgImg.src = url;
                return; // Exit here, as the rest is handled by the bgImg.onload
            }
    
            // Draw the image on top of the background
            ctx.drawImage(img, 0, 0);
    
            const dataURL = canvas.toDataURL('image/png');
    
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'processed.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    
        img.src = previewImage.src;
    });

    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        previewImage.style.transform = `scale(${scale})`;
        previewImage.style.left = '0px';
        previewImage.style.top = '0px';
    }

    // Add event listener to reset button
    document.getElementById('reset-zoom-btn').addEventListener('click', resetZoom);
    
    // ----------- ------------------------- Create color options ----------------------------
    // =======================================================================================

    // Show/Hide color options when "Add Color" button is clicked
    addColorBtn.addEventListener("click", function () {
        colorOptions.style.display = colorOptions.style.display === "none" ? "grid" : "none";
    });
    
    
    // Close when clicking outside the color options
    // document.addEventListener("click", function (event) {
    //     if (!bgColorOptions.contains(event.target) && event.target !== bgColorBtn) {
    //         bgColorOptions.style.display = "none"; // Hide if clicking outside
    //     }
    // });

    // // Prevent closing when clicking inside the color options container
    // bgColorOptions.addEventListener("click", function (event) {
    //     event.stopPropagation(); // Stop event from bubbling up
    // });
       

    // Apply selected color from predefined options
    colorItems.forEach(item => {
        item.addEventListener("click", function () {
            let selectedColor = item.style.backgroundColor;
            previewContainer.style.backgroundColor = selectedColor;
        });
    });

    // Show color picker when "Mix Color" is clicked
    mixColorBtn.addEventListener("click", function () {
        colorPicker.click(); // Open color picker
    });

    // Apply selected color from color picker
    colorPicker.addEventListener("input", function () {
        previewContainer.style.backgroundColor = colorPicker.value;
    });  
    


});