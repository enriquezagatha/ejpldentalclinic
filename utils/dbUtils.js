// Helper function to find a user by email
async function findUserByEmail(Model, email) {
    return await Model.findOne({ email });
}

module.exports = { findUserByEmail };