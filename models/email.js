import nodemailer from "nodemailer";

async function sendMails(email,title, text,html) {
    
    let transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      disableFileAccess: true,
      auth: {
        user: "Chlpscanada2022@gmail.com", // generated ethereal user
        pass: "klngwpwspctrhdxf", // generated ethereal password
      },
    });

    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });

    // send mail with defined transport object
     await transporter.sendMail({
      from: "support@achlps.com", // sender address
      to: email, // list of receivers
      subject: title, // Subject line
      html: html, // html body
      text: text, // plain text body
    });
}


export default sendMails;