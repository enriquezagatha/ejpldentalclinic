function generateReferenceNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let randomString = 'EJPL-';

    for (let i = 0; i < 9; i++) {
        if (Math.random() < 0.5) {
            randomString += letters.charAt(Math.floor(Math.random() * letters.length));
        } else {
            randomString += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
    }

    return randomString;
}

module.exports = { generateReferenceNumber };