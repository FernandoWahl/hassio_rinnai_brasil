
module.exports = app => {
    let logger = app.middlewares.log.logger;
    let service = app.services.auth;

    this.userLogin = (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        service.userLogin(username, password)
            .then(result => res.status(200).send({ token: result.token }))
            .catch(error => res.status(400).send({message: error?.message || error}));
    }

    this.userVerification = (req, res) => {
        let token = req.headers['authorization'];
        logger.debug("controller:userVerification:token", token);

        service.userVerification(token)
            .then(() => res.status(204).send({}))
            .catch(error => res.status(400).send({message: error?.message || error}));
    }

    return this
};