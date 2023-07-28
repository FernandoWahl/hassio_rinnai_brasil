require('dotenv').config()
const prefix = process.env.APP_PREFIX;

/** @param { import('express').Express } app */
module.exports = app => {

    let controller = app.controllers.rinnai

	app.get(`${prefix}/consumption`, controller.consumption)
    app.get(`${prefix}/state`, controller.state)
    app.get(`${prefix}/device/params`, controller.deviceParams)
    app.get(`${prefix}/historic`, controller.historic)
    app.get(`${prefix}/historic/errors`, controller.errorHistoric)

    app.post(`${prefix}/state`, controller.setState)
    app.post(`${prefix}/temperature/increase`, controller.increaseTemperature)
    app.post(`${prefix}/temperature/decrease`, controller.decreaseTemperature)
}