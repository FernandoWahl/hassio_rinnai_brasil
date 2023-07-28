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

    this.state = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.state())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    this.historic = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.historic())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    this.errorHistoric = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.errorHistoric())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }
    

    this.deviceParams = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.deviceParams())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    this.setState = (req, res) => {
        let token = req.headers['authorization'];
        const isOn = req.body.isOn;
        auth.verifyJwt(token)
            .then(() => service.setState(isOn))
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    this.increaseTemperature = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.increaseTemperature())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    this.decreaseTemperature = (req, res) => {
        let token = req.headers['authorization'];
        auth.verifyJwt(token)
            .then(() => service.decreaseTemperature())
            .then(result => res.status(200).send(result))
            .catch(err => res.status(401).send(err));
    }

    return this
};