const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'igycol@yahoo.co.uk',
    subject: 'welcome to the app',
    text: `Welcome to the app, ${name}, let us know how are you getting along`
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'igycol@yahoo.co.uk',
    subject: 'cancelation confirmation',
    text: `We are sorry to see you go, ${name}`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
}










// sgMail.send({
//   to: 'igycol@yahoo.co.uk',
//   from: 'igycol@yahoo.co.uk',
//   subject: 'this is my first creation',
//   text: 'i hope this one actually gets to you'
// })