module.exports = app => {
    let auth = app.services.auth;
    let service = app.services.rinnai;

    this.consumption = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.consumption())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    return this
};