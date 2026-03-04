const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Check for required environment variables
  if (
    !process.env.EMAIL_SERVICE ||
    !process.env.EMAIL_USERNAME ||
    !process.env.EMAIL_PASSWORD ||
    !process.env.EMAIL_FROM
  ) {
    console.error(
      "Email configuration missing. Please check your .env file for EMAIL_SERVICE, EMAIL_USERNAME, EMAIL_PASSWORD, and EMAIL_FROM.",
    );
    throw new Error("Email configuration missing");
  }

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
