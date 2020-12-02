const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { readHTMLFile } = require('./utils/readHtmlFile');
const { capitalizeWords } = require('./utils/capitalizeWords');
const { dateDiffInDays } = require('./utils/dateDiffInDays')
// Constants
const emailsData = require('./constants/emailsData.json');
const { user } = require('firebase-functions/lib/providers/auth');

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

handlebars.registerHelper("link", (text, url) => {
    const childUrl = handlebars.escapeExpression(url);
    const childText = handlebars.escapeExpression(text);
        
   return new handlebars.SafeString("<a href='" + childUrl + "' rel='noreferrer noopener' >" + childText +"</a>");
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

    readHTMLFile('./EmailTemplates/email.html', (err, html) => {
        if ( err ) return res.send('Error');
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

exports.sendCampaign = async (req, res, admin) => {
    const dest = req.body.dest;
    const message = req.body.msg;
    const subject = req.body.subject;

    let accounts = null;

    accounts = await admin.database().ref('/accounts').once('value')
        .then((snapshot) => {
            return accounts = snapshot.val();
        })
        .catch((err) => {
            console.log(err);
            return res.send('Issue with database');
        });
    
    if ( Object.keys(accounts).length === 0 || !accounts ) return res.send('no accounts available, check database');

    const subscribedUsers = Object.values(accounts).filter(user => user.newsletter === "subscribed");

    if ( subscribedUsers.length === 0 ) return res.send('no users subscribed to newsletter');
    if ( Object.keys(emailsData.campaigns.signUp).length === 0 ) return res.send('no campaign emails defined');

    const currentDate = new Date();

    for (let i in Object.keys(emailsData.campaigns.signUp)) {
        const campaignDay = parseInt(Object.keys(emailsData.campaigns.signUp[i]))
        const userList = subscribedUsers.filter(user => dateDiffInDays(new Date(user.createdOn), currentDate) === campaignDay);
        console.log(userList);
        // for (let j in  )
    }

    return res.send('worked');

    readHTMLFile('./EmailTemplates/email.html', (err, html) => {
        if ( err ) return res.send('Error');
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