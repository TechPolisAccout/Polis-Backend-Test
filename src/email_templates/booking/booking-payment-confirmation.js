module.exports.BOOKING_PAYMENT_CONFIRMATION_TEMPLATE = (booking, role) => {
  if (role === 'HOST') {
    return `
      <div style="font-family: Nunito, sans-serif; width: auto;max-width: 30rem;margin:auto;">
        <h1 style="font-size: 25px;">Hello <span style="color: #3270fc;">${booking.property.user.name}</span></h1>
        <p style="font-size: 15px;line-height: 22.5px;">We are pleased to inform you that a payment has been
            successfully received for
            <strong>${booking.property.title}</strong>
        </p>
        <div>
            <h2 style="font-size: 17px;">Booking Details:</h2>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Property Name:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.property.title}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Guest Name:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.user.name}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Check-In Date:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.startDate}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Check-Out Date:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.endDate}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Number of Guests:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.numberOfGuests}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Amount Paid:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.totalCost}</h3>
            </div>
        </div>
        <div>
          <p style="font-size: 15px; line-height: 22.5px;">The payment has been processed and the booking is confirmed.</p>
          <p style="font-size: 15px; line-height: 22.5px;">If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        </div>
        <div>
            <p style="font-size: 15px;line-height: 22.5px;">Best regards,</p>
            <p style="font-size: 15px;line-height: 22.5px;">Polis Admin</p>

        </div>
    </div>
   `;
  }
  if (role === 'USER') {
    return `
  <div style="font-family: Nunito, sans-serif; width: auto;max-width: 30rem;margin:auto;">
        <h1 style="font-size: 25px;">Hello <span style="color: #3270fc;">${booking.user.name}</span></h1>
        <p style="font-size: 15px;line-height: 22.5px;">We are pleased to inform you that your payment for
            <strong>${booking.property.title}</strong> booking has been successfully processed!
        </p>
        <div>
            <h2 style="font-size: 17px;">Booking Details:</h2>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Property Name:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.property.title}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Check-In Date:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.startDate}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Check-Out Date:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.endDate}</h3>
            </div>
            <div style="display:flex;flex-wrap:wrap">
                <h3 style="font-size: 15px;line-height: 22.5px;">Amount Paid:</h3>
                <h3 style="font-weight:normal;margin-left:0.5rem;font-size: 15px;line-height: 22.5px;">
                    ${booking.totalCost}</h3>
            </div>
        </div>
        <div>
            <p style="font-size: 15px; line-height: 22.5px;">Thank you for
                choosing <strong>${booking.property.title}</strong>.Your booking is now confirmed, and we look forward
                to welcoming you.</p>
            <p style="font-size: 15px; line-height: 22.5px;">If you have any
                questions or need further assistance, please do not hesitate to contact us.</p>
        </div>
        <div>
            <p style="font-size: 15px;line-height: 22.5px;">Thank you,</p>
            <p style="font-size: 15px;line-height: 22.5px;">Polis Admin</p>
        </div>
    </div>
            `;
  }
};
