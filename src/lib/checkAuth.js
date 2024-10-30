const checkAuth = (context, id) => {
  if (!context.currentUser) {
    throw new Error('Unauthorized operation');
  }

  if (context.currentUser.id !== id) {
    throw new Error('Unauthorized operation');
  }
};

module.exports = checkAuth;
