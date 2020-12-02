const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { readHTMLFile } = require('./utils/readHtmlFile');
const { capitalizeWords } = require('./utils/capitalizeWords');
const { dateDiffInDays } = require('./utils/dateDiffInDays')
// Constants
const { emailsData } = require('./constants/emailsData');
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
    const link = `<a target="_blank" href="${childUrl}" rel="noreferrer noopener">${childText}</a>`
   return new handlebars.SafeString(link);
});

exports.sendEmail = (req, res) => {
    const dest = req.body.dest;
    const name = req.body.name || "";
    const urlBtn = req.body.urlBtn;
    const textFooter = req.body.textFooter;
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
                urlText: urlBtn ? urlBtn.text || "" : "",
                textFooter: textFooter || "Atentamente"
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

const asyncEmailSender = (options) => {
    return new Promise((resolve, reject) => {

      transporter.sendMail(options, (err, res) => {
        if (err) console.log(err)
        return resolve(res);
      });
    });
}

exports.sendCampaign = async (req, res, admin) => {

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

    readHTMLFile('./EmailTemplates/email.html', async (err, html) => {

        if ( err ) return res.send('Error in reading html template');
        const template = handlebars.compile(html);

        for (let i in Object.keys(emailsData.campaigns.signUp)) {
            const campaignDay = parseInt(Object.keys(emailsData.campaigns.signUp)[i])
            const userList = subscribedUsers.filter(user => dateDiffInDays(new Date(user.createdOn), currentDate) === campaignDay);

            for (let j in userList) {
                console.log("iterating", userList[j]);
                const name = userList[j].name;
                const message = Object.values(emailsData.campaigns.signUp)[i].message;
                const subject = Object.values(emailsData.campaigns.signUp)[i].subject;
                const urlBtn = Object.values(emailsData.campaigns.signUp)[i].urlBtn;
                const textFooter = Object.values(emailsData.campaigns.signUp)[i].textFooter;

                const replacements = {
                    name: name.trim() !== "" ? `, ${capitalizeWords(name.toLowerCase())}` : "",
                    message,
                    subject,
                    url: urlBtn ? urlBtn.url || null : null,
                    urlText: urlBtn ? urlBtn.text || "" : "",
                    textFooter: textFooter || "Atentamente"
                };
    
                const htmlToSend = template(replacements);
        
                const mailOptions = {
                    from: 'Liberty Academy <no-reply@libertyacademy.trading>',
                    to: userList[j].email,
                    subject,
                    html: htmlToSend
                };

                asyncEmailSender(mailOptions);
            }
        }
        return res.send('Done');
    });
    return res.send('Done');
}