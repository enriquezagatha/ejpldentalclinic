const bcrypt = require("bcryptjs");

// Helper function to update user email and/or password
async function updateUser(user, newEmail, newPassword) {
  let emailUpdated = false;
  let passwordUpdated = false;

  // Update email if changed
  if (user.email !== newEmail) {
    user.email = newEmail;
    emailUpdated = true;
  }

  // Update password if provided
  if (newPassword) {
    user.password = await bcrypt.hash(newPassword, 10);
    passwordUpdated = true;
  }

  await user.save();
  return { emailUpdated, passwordUpdated };
}

// Update user email and/or password
exports.updateUser = async (user, newEmail, newPassword) => {
  let emailUpdated = false;
  let passwordUpdated = false;

  if (newEmail && newEmail !== user.email) {
    user.email = newEmail;
    emailUpdated = true;
  }

  if (newPassword) {
    user.password = await bcrypt.hash(newPassword, 10);
    passwordUpdated = true;
  }

  await user.save();
  return { emailUpdated, passwordUpdated };
};

module.exports = { updateUser };
