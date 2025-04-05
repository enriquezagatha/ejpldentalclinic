// Dynamically load reusable head links
fetch('../components/head-links.html')
    .then(response => response.text())
    .then(data => document.head.insertAdjacentHTML('beforeend', data));
