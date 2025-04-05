fetch('../components/footer.html')
    .then(response => response.text())
    .then(footerHTML => {
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
        } else {
            console.error('Footer container not found in the DOM.');
        }
    })
    .catch(error => {
        console.error('Failed to load footer:', error);
    });