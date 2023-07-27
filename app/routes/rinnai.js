const prefix = process.env.APP_PREFIX;

/** @param { import('express').Express } app */
module.exports = app => {

    let controller = app.controllers.rinnai;

	app.get(`${prefix}/consumption`, controller.consumption);
}