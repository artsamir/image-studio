/*function toggleMenu() {
    const navLinks = document.querySelector(".nav-links");
    const menuIcon = document.querySelector(".menu-icon i");
    const overlay = document.getElementById('overlay'); //new

    navLinks.classList.toggle("active");
    overlay.classList.toggle('active'); //new

    // Change icon based on active state
    if (navLinks.classList.contains("active")) {
        menuIcon.classList.remove("fa-bars"); // Remove hamburger icon
        menuIcon.classList.add("fa-times"); // Add close icon
    } else {
        menuIcon.classList.remove("fa-times"); // Remove close icon
        menuIcon.classList.add("fa-bars"); // Add hamburger icon
    }
} */

// Toggle search box
document.addEventListener('DOMContentLoaded', function () {
    const searchIcon = document.getElementById('search-icon');
    const searchBox = document.getElementById('search-box');
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.querySelector('.menu-icon');
    const hasSubmenu = document.querySelectorAll('.has-submenu');
    const fileInput = document.getElementById("fileInput");
    const dropArea = document.getElementById("drop-area");
    const previewImage = document.getElementById("preview-image");
    const loader = document.getElementById("loader");
    const removeBgBtn = document.getElementById("remove-bg-btn");
    const downloadBtn = document.getElementById("download-btn");
    const previewContainer = document.getElementById('preview-container');
    const magnifierBtn = document.getElementById('magnifier-btn');
    const bgImageOptions = document.getElementById('bg-image-options');

    let isMagnifierEnabled = false;
    let scale = 1;
    const zoomIncrement = 0.1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX, startY;

    // For color select validation
    const bgColorBtn = document.getElementById('bg-color-btn');
    const bgColorOptions = document.getElementById('bg-color-options');
    const mixColorBtn = document.getElementById('mixColor');
    const colorPicker = document.getElementById('colorPicker');
    const colorItems = document.querySelectorAll('.color-item');
    const closeColorOptions = document.getElementById('close-color-options');  
    
    // Toggle menu
    menuIcon.addEventListener('click', function () {
        navLinks.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // Close menu when overlay is clicked
    overlay.addEventListener('click', function () {
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
        closeSubmenus();
    });

    // Toggle search box
    searchIcon.addEventListener('click', function () {
        searchBox.classList.toggle('active');
        if (searchBox.classList.contains('active')) {
            searchBox.focus();
        }
    });

    // Close search box when clicking outside
    document.addEventListener('click', function (e) {
        if (!searchIcon.contains(e.target) && !searchBox.contains(e.target)) {
            searchBox.classList.remove('active');
        }
    });

    // Submenu functionality
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

    // Close submenus when clicking outside
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 968) {
            hasSubmenu.forEach(item => {
                if (!item.contains(e.target)) {
                    item.classList.remove('active');
                }
            });
        }
    });

    // Function to close all submenus
    function closeSubmenus() {
        hasSubmenu.forEach(item => {
            item.classList.remove('active');
        });
    }


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
    
        let containerWidth, containerHeight;
    
        if (screenWidth >= 1440) {
            containerWidth = height > width ? '378px' : '864px';
            containerHeight = height > width ? '576px' : '455px';
        } else if (screenWidth >= 1240) {
            containerWidth = height > width ? '378px' : '663px';
            containerHeight = height > width ? '576px' : '350px';
        } else if (screenWidth >= 970) {
            containerWidth = height > width ? '328px' : '532px';
            containerHeight = height > width ? '476px' : '289px';
        } else if (screenWidth >= 768) {
            containerWidth = height > width ? '328px' : '490px';
            containerHeight = height > width ? '476px' : '289px';
        } else if (screenWidth >= 577) {
            containerWidth = height > width ? '328px' : '478px';
            containerHeight = height > width ? '476px' : '289px';
        } else if (screenWidth >= 430) {
            containerWidth = height > width ? '300px' : '313px';
            containerHeight = height > width ? '436px' : '189px';
        } else if (screenWidth >= 366) {
            containerWidth = height > width ? '268px' : '289px';
            containerHeight = height > width ? '436px' : '189px';
        } else if (screenWidth >= 313) {
            containerWidth = height > width ? '238px' : '159px';
            containerHeight = height > width ? '436px' : '89px';
        } else { // Handle screenWidth < 313
            containerWidth = height > width ? '138px' : '159px';
            containerHeight = height > width ? '476px' : '89px';
        }
    
        previewContainer.style.width = containerWidth;
        previewContainer.style.height = containerHeight;
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
        magnifier.style.left = `${x - 85}px`; // Center the magnifier on the cursor
        magnifier.style.top = `${y - 85}px`;
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
    
    if (bgColorBtn && bgColorOptions) {
        // Toggle color options on button click
        bgColorBtn.addEventListener('click', function () {
            bgColorOptions.style.display = bgColorOptions.style.display === 'grid' ? 'none' : 'grid';
        });

        // Close color options on "X" click
        closeColorOptions.addEventListener('click', function () {
            bgColorOptions.style.display = 'none';
        });

        // Close color options when clicking outside
        document.addEventListener('click', function (event) {
            if (!bgColorBtn.contains(event.target) && !bgColorOptions.contains(event.target)) {
                bgColorOptions.style.display = 'none';
            }
        });

        // Apply selected color from predefined options
        colorItems.forEach(item => {
            item.addEventListener('click', function () {
                let selectedColor = item.style.backgroundColor;
                previewContainer.style.backgroundColor = selectedColor;
                bgColorOptions.style.display = 'none'; // Close options after selection
            });
        });

        // Show color picker when "Mix Color" is clicked
        mixColorBtn.addEventListener('click', function () {
            colorPicker.click(); // Open color picker
        });

        // Apply selected color from color picker
        colorPicker.addEventListener('input', function () {
            previewContainer.style.backgroundColor = colorPicker.value;
            bgColorOptions.style.display = 'none'; // Close options after selection
        });
    } else {
        console.log('bg-color-btn or bg-color-options not found');
    }



});