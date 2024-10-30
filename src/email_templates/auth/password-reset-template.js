module.exports.PASSWORD_RESET_TEMPLATE = (resetLink) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; ">
      <h2 style="color: #4338ca;">Password Reset</h2>
      <p style="font-size: 16px;">Dear User,</p>
      <p style="font-size: 16px;">We have received a request to reset your password. Please click on the following link to reset your password:</p>
      <a href="${resetLink}" style="display: inline-block; background-color: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 16px; margin-top: 20px;">Reset Password</a>
      <p style="font-size: 14px; margin-top: 20px;">Best regards,</p>
      <p style="font-size: 14px;">Ogle</p>
    </div>
  `;
};
