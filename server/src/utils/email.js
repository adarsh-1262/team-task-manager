import nodemailer from "nodemailer";

let transporter;

// Initialize email transporter
const initEmailTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

// Send invite email
export const sendInviteEmail = async (email, inviteUrl, senderName) => {
  try {
    const mailer = initEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "You're invited to join Team Task Manager",
      html: `
        <h2>Welcome to Team Task Manager!</h2>
        <p>Hi,</p>
        <p>${senderName} has invited you to join their organization on Team Task Manager.</p>
        <p>Click the link below to accept the invitation:</p>
        <p>
          <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${inviteUrl}</p>
        <p>This invitation will expire in 7 days.</p>
        <p>Best regards,<br>Team Task Manager</p>
      `
    };

    await mailer.sendMail(mailOptions);
    console.log(`Invite email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending invite email:", error);
    throw error;
  }
};
