const prefix = process.env.APP_PREFIX;

/** @param { import('express').Express } app */
module.exports = app => {

    let controller = app.controllers.auth;

    app.post(`${prefix}/login`, controller.userLogin);
	app.get(`${prefix}/verify`, controller.userVerification);
}