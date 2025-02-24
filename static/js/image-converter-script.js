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
});