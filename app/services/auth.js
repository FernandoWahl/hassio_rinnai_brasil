require('dotenv').config()
const jwt = require('jsonwebtoken')


/** @param { import('express').Express } app */
module.exports = app => {
    let logger = app.middlewares.log.logger;
    let options = app.middlewares.global.options;

    this.userLogin = (username, password) => {
        return new Promise((resolve, reject) => {
            logger.debug("service:login:username", username)
            let user = options.users.find(u => u.username == username && u.password == password)
            let token = jwt.sign({ result: `login:${username}` }, process.env.APP_JWT_SECRET, { expiresIn: "72h" });
            user ? resolve({token}) : reject({ message: 'Usuário ou senha não encontrada'})
        });
    }


    this.userVerification = (token) => {
        return new Promise((resolve, reject) => {
            if (!token) {
                reject({ message: 'Nenhum token fornecido.' })
                return
            }
            jwt.verify(token.replace("Bearer ", ""), process.env.APP_JWT_SECRET, function (error, decoded) {
                if (error) {
                    logger.error("controller:userVerification:error", error?.message || error)
                    reject({ message: 'Falha ao autenticar o token.' })
                    return
                }
                resolve(decoded.result)
            });
        });
    }

    this.verifyJwt = (auth) => {
        return new Promise((resolve, reject) => {
            let token = auth.replace("Bearer ", "");
            jwt.verify(token, process.env.APP_JWT_SECRET, function (err, decoded) {
                if (err) {
                    logger.error("service:verifyJwt:error", err);
                    reject({ message: 'Falha ao autenticar o token.' })
                }
                resolve(decoded.result);
            });
        });
    }
    return this
};