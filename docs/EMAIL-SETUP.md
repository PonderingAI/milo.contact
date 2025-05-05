# Email Notification Setup

This document explains how to set up email notifications for the contact form.

## Configuration

To enable email notifications, you need to add the following environment variables to your `.env.local` file:

\`\`\`
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Portfolio Contact Form <your-email@gmail.com>
\`\`\`

## Using Gmail

If you're using Gmail, you'll need to create an "App Password" instead of using your regular password:

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled
4. Go to "App passwords"
5. Create a new app password for "Mail" and "Other (Custom name)"
6. Use the generated password as your `EMAIL_PASSWORD`

## Using Other Email Providers

For other email providers, you'll need to:

1. Find their SMTP settings (host, port, secure)
2. Use your email address and password
3. Update the environment variables accordingly

## Testing

To test if your email configuration is working:

1. Submit a message through the contact form
2. Check your email inbox for the notification
3. If you don't receive an email, check the server logs for any errors

## Troubleshooting

Common issues:

- **Authentication failed**: Check your email and password
- **Connection refused**: Check your host and port settings
- **Timeout**: Your email provider might be blocking the connection

For Gmail users, make sure you're using an App Password, not your regular password.
