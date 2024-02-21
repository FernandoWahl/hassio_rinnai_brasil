/** @param { import('express').Express } app */
module.exports = app => {
    let options = app.hassio.config.options;
    let logger = app.middlewares.log.logger;
    let mqttClient = app.hassio.connections.mqtt;

    const { delay } = app.middlewares.global.utils;

    const pollIntervalInMs = (options.device.poll_interval * 1_000) || 2_000

    const update = async () => {
        let device = app.hassio.device;
        await device.updateDeviceState()
        await delay(500)
        await device.updateParameters()
        await delay(500)
        await device.updateConsumption()
    }

    const recreateEntities = () => {
        app.hassio.entities.initConfig();
    }

    mqttClient.on("connect", () => {
        logger.debug(`[MQTT] Connected success!`);

        try {
            setInterval(update, pollIntervalInMs)

            let entities = app.hassio.entities;
            mqttClient.subscribe(entities.waterHeater.mode_command_topic, (error) => {
                if (error) logger.error("[MQTT] set water heater mode subscription error", error?.message || error)
                else logger.debug('[MQTT] subscribed to water heater mode topic')
            })

            mqttClient.subscribe(entities.waterHeater.temperature_command_topic, (error) => {
                if (error) logger.error("[MQTT] set water heater temp subscription error", error?.message || error)
                else logger.debug('[MQTT] subscribed to water heater temp topic')
            })

            setInterval(recreateEntities, 600000)
        } catch (error) {
            logger.error("hassio:error", error?.message || error)
        }
    })

    mqttClient.on('message', (topic, message) => {
        try {
            logger.debug(`[MQTT] send message to topic '${topic}' and message '${message}'`)
            let entities = app.hassio.entities;
            let device = app.hassio.device;
            switch (topic) {
                case entities.waterHeater.mode_command_topic:
                    device.setPowerState(message.toString())
                    break;
                case entities.waterHeater.temperature_command_topic:
                    device.setTargetWaterTemperature(Math.trunc(+message.toString()))
                    break;
            }
        } catch (error) {
            logger.error("hassio:error", error?.message || error)
        }
    })
}