import nodemailer from 'nodemailer';

export async function sendEmail(to: string, html: string) {
  // let testAccount = await nodemailer.createTestAccount();

  // console.log(testAccount);
  const testAccount = {
    user: 'cj2tfmd4ng6fqbyy@ethereal.email',
    pass: 'SrD3DztPhWcvNkC1Yh',
  };

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>',
    to,
    subject: 'Reset Password',
    html,
  });

  console.log('Message sent: %s', info.messageId);

  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
}
