document.addEventListener('DOMContentLoaded', function () {
    const searchIcon = document.getElementById('search-icon');
    const searchBox = document.getElementById('search-box');
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.querySelector('.menu-icon');
    const hasSubmenu = document.querySelectorAll('.has-submenu');

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
        const parentLink = item.querySelector('a');

        parentLink.addEventListener('click', function (e) {
            if (window.innerWidth <= 968) {
                e.preventDefault();
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
});