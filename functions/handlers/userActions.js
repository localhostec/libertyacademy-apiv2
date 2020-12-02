exports.unsubscribeFromNewsletter = (req, res, admin) => {
    const id = req.params.id;

    if ( !id ) return res.send('Por favor especifica un id de usuario');

    admin.database().ref(`/accounts/${id}`)
        .update({
            newsletter: 'unsubscribed'
        })
        .then(() => {
            return res.send('Done');
        })
        .catch((err) => {
            console.log(err);
            return res.send('Issue with database');
        });
    return res.send('Finished');
}
