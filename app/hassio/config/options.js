const fs = require("fs");
const isProduction = process.env.NODE_ENV === "production"
const rawOptions = fs.readFileSync(isProduction ? '/data/options.json' : './options-mock.json', 'utf8');

/** @param { import('express').Express } app */
module.exports = app => {
    const optionsFromfile = JSON.parse(rawOptions)
    return {
        mqtt: {
            host: optionsFromfile.mqtt_host,
            user: optionsFromfile.mqtt_user,
            password: optionsFromfile.mqtt_password,
        },
        device: {
            model: optionsFromfile.device_model,
            serialNumber: optionsFromfile.device_serial_number,
            host: optionsFromfile.device_host,
            poll_interval: optionsFromfile.device_poll_interval
        },
        haIp: optionsFromfile.ha_ip
    }
};