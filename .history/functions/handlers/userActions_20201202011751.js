exports.unsubscribeFromNewsletter = (req, res, admin) => {
    const id = req.params.id;

    if ( !id ) return res.send('Por favor especifica un id de usuario');

    admin.database().ref(`/accounts/${id}`)
        .update({
            newsletter: 'unsubscribed'
        })
        .then(() => {
            res.send('Done');
            return res.end();
        })
        .catch((err) => {
            console.log(err);
            res.send('Issue with database');
            return res.end();
        });
    return res.send('Finished');
}
