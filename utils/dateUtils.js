// Define month names
const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Helper function to format the date
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    const monthName = monthNames[parseInt(month, 10) - 1]; // Month is 0-indexed in arrays
    return `${monthName} ${day}, ${year}`; // Format: Month Name Day, Year
}

module.exports = {monthNames, formatDate};