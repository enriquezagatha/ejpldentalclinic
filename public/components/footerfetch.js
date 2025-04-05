fetch('../components/footer.html')
    .then(response => response.text())
    .then(footerHTML => {
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            footerContainer.innerHTML = footerHTML;
            updateCopyrightYear();
        } else {
            console.error('Footer container not found in the DOM.');
        }
    })
    .catch(error => {
        console.error('Failed to load footer:', error);
    });

function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();
    const yearElement = document.getElementById('copyright-year');
    if (yearElement) {
        yearElement.textContent = currentYear;
    } else {
        console.error('Copyright year element not found in the DOM.');
    }
}