const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send a notification to a specific user
 */
const notifyUser = async (userId, type, title, message, link = '') => {
  try {
    const notification = new Notification({
      recipient: userId,
      type,
      title,
      message,
      link
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error in notifyUser:', error);
  }
};

/**
 * Send a notification to all users matching a specific role
 */
const notifyUsersByRole = async (role, type, title, message, link = '') => {
  try {
    const users = await User.find({ role });
    if (users.length === 0) return;

    const notifications = users.map(user => ({
      recipient: user._id,
      type,
      title,
      message,
      link
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error in notifyUsersByRole:', error);
  }
};

module.exports = {
  notifyUser,
  notifyUsersByRole
};
