module.exports.BOOKING_REQUEST_REJECTED_TEMPLATE = (user, booking,url) => {
  return `
     <div style="font-family: Nunito, sans-serif; width: auto;max-width: 30rem;margin:auto;">
        <h1 style="font-size: 25px;">Hello <span style="color: #3270fc;">${user.name}</span>,</h1>
        <p style="font-size: 15px;line-height: 22.5px;">Thank you for your interest in booking with us. Unfortunately,
            we regret to inform
            you that your booking request for <strong>${booking.property.title}</strong> from
            <strong>${booking.startDate}</strong> to <strong>${booking.endDate}</strong> has been declined.
        </p>

        <p style="font-size: 15px;line-height: 22.5px;">We apologize for any inconvenience this may cause. If you have
            any questions or need
            further assistance, please contact us at <a href="mailto:admin@polis.ng">admin@polis.ng</a>.</p>
        <p style="font-size: 15px;line-height: 22.5px;">You might also want to check out other properties. Click <a
                href="${url}">here</a> to
            explore our available listings.</p>
        <p style="font-size: 15px;line-height: 22.5px;">Thank you for your understanding.</p>
        <div>
            <p style="font-size: 15px;line-height: 22.5px;"> Best regards,</p>
            <p style="font-size: 15px;line-height: 22.5px;">Polis Admin</p>
        </div>
    </div>
`;
};
