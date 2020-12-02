const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { readHTMLFile } = require('./utils/readHtmlFile');
const { capitalizeWords } = require('./utils/capitalizeWords');
// Constants
const emailsData = require('./constants/emailsData.json');

const transporter = nodemailer.createTransport({
    host: 'mail.libertyacademy.trading',
    port: 465,
    secure: true,
    auth: {
        user: 'no-reply@libertyacademy.trading',
        pass: 'Libertytrading2020!'
    },
    tls: {
        rejectUnauthorized: process.env.FUNCTIONS_EMULATOR === "true" ? false : true
    }
});

handlebars.registerHelper("link", function(text, url) {
    var url = handlebars.escapeExpression(url),
        text = handlebars.escapeExpression(text)
        
   return new handlebars.SafeString("<a href='" + url + "' rel='noreferrer noopener' >" + text +"</a>");
});

exports.sendEmail = (req, res) => {
    const dest = req.body.dest;
    const name = req.body.name || "";
    const urlBtn = req.body.urlBtn;
    let message = "";

    if ( req.body.type && req.body.type === "emailConfirmation" ) {
        message = emailsData.welcome.message;
    } else if ( req.body.msg ) {
        message = req.body.msg;
    }

    const subject = req.body.subject || "Liberty Trading Academy";

    readHTMLFile('./EmailTemplates/email.html', function(err, html) {
        const template = handlebars.compile(html);
        const replacements = {
                name: name.trim() !== "" ? `, ${capitalizeWords(name.toLowerCase())}` : "",
                message,
                subject,
                url: urlBtn ? urlBtn.url || null : null,
                urlText: urlBtn ? urlBtn.text || "" : ""
        };

        const htmlToSend = template(replacements);

        const mailOptions = {
            from: 'Liberty Academy <no-reply@libertyacademy.trading>',
            to: dest,
            subject: subject,
            html: htmlToSend
        };
    
        return transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                return res.send(error.toString());
            }
            return res.send('Sent');
        });

    });
}

exports.sendCampaign = (req, res, admin) => {
    const dest = req.body.dest;
    const message = req.body.msg;
    const subject = req.body.subject;

    admin.database().ref('/').once('value')
    .then((snapshot) => {
        console.log(snapshot.val())
        return res.send('worked');
    })
    .catch((err) => {
        console.log(err);
        return res.send('didnt work');
    });

    readHTMLFile('./EmailTemplates/email.html', function(err, html) {
        const template = handlebars.compile(html);
        const replacements = {
                title: "John Doe"
        };
        const htmlToSend = template(replacements);

        const mailOptions = {
            from: 'Liberty Academy <no-reply@libertyacademy.trading>',
            to: dest,
            subject: subject,
            html: htmlToSend
        };
    
        return transporter.sendMail(mailOptions, (error, info) => {
            if(error){
                return res.send(error.toString());
            }
            return res.send('Sent');
        });

    });
}