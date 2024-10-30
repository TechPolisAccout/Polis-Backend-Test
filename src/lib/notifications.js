const sendNotification = (io, userId, title, body, url = null) => {
  try {
    const notification = {
      title,
      body,
      timestamp: new Date(),
      read: false,
    };

    // Add the URL if provided
    if (url) {
      notification.url = url;
    }

    // Emit the notification to the user
    io.to(userId).emit('notification', notification);

    console.log({ notification });
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
};

module.exports = sendNotification;
