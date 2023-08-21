/** @param { import('express').Express } app */
module.exports = app => {

    const rinnai = app.hassio.connections.rinnai;
    const logger = app.middlewares.log.logger;
    const service = app.services.rinnai;
    const device = this

    this.updateDeviceState = (retries = 0) => {
        let entities = app.hassio.entities;

        return new Promise((resolve, reject) => {
            logger.debug(`device:updateDeviceState:retries - ${retries}`)
            if (rinnai.getPreventUpdate()) {
                logger.debug("device:updateDeviceState - Preventing state update")
                return;
            }
            service.state()
                .then(response => {
                    entities.waterHeater.publish(response.isPoweredOn ? 'gas' : 'off', 'mode')
                    entities.waterHeater.publish(response.targetTemperature, 'temperature')
                    entities.heatingState.publish(response.isHeating ? 'ON' : 'OFF')
                    resolve(response) 
                })
                .catch(error => {
                    logger.error("service:updateDeviceState:error", error?.message || error);
                    if (retries < 5) {
                        return setTimeout(() => {
                            device.updateDeviceState(retries + 1)
                        }, 500 * (retries + 1))
                    } else {
                        entities.waterHeater.updateAvailability(false)
                        entities.heatingState.updateAvailability(false)
                        reject({
                            message: error?.message || error
                        }) 
                    }
                });
        })
    }
    
    this.updateParameters = (retries = 0) => {
        return new Promise((resolve, reject) => { 
            let entities = app.hassio.entities;
            logger.debug(`device:updateParameters:retries - ${retries}`)
            if (rinnai.getPreventUpdate()) {
                logger.debug("device:updateParameters - Preventing parameters update")
                return;
            }
            service.deviceParams()
                .then(response => {
                    entities.waterHeater.publish(response.temperature.outlet, 'temperature/current')
                    entities.inletWaterTemperature.publish(response.temperature.inlet)
                    entities.outletWaterTemperature.publish(response.temperature.outlet)
                    entities.power.publish(response.device.powerInkW)
                    entities.waterFlow.publish(response.water.waterFlow)
                    entities.inletWaterTemperature.publish(response.temperature.inlet)
                    entities.wifiSignal.publish(response.device.connect.wifiPowerDBm)
                    resolve(response) 
                })
                .catch(error => {
                    logger.error("service:updateParameters:error", error?.message || error);
                    if (retries < 5) {
                        return setTimeout(() => {
                            device.updateDeviceState(retries + 1)
                        }, 500 * (retries + 1))
                    } else {
                        entities.waterHeater.updateAvailability(false)
                        entities.inletWaterTemperature.updateAvailability(false)
                        entities.outletWaterTemperature.updateAvailability(false)
                        entities.power.updateAvailability(false)
                        entities.waterFlow.updateAvailability(false)
                        entities.wifiSignal.updateAvailability(false)
                        reject({
                            message: error?.message || error
                        }) 
                    }
                });
        })
    }

    let lastWaterMeasurement = -1
    let lastGasMeasurement = -1
    let lastWorkingTime = -1
    this.updateConsumption = (retries = 0) => {
        let entities = app.hassio.entities;

        return new Promise((resolve, reject) => {
            logger.debug(`device:updateConsumption:retries - ${retries}`)
            service.consumption()
                .then(({ workingTime, water, gasM3 }) => {
                    if (lastWaterMeasurement > water) {
                        entities.waterConsumption.publish(0)
                    }
                    lastWaterMeasurement = water
        
                    if (lastGasMeasurement > gasM3) {
                        entities.gasConsumption.publish(0)
                    }
                    lastGasMeasurement = gasM3
        
                    if (lastWorkingTime > workingTime) {
                        entities.workingTime.publish(0)
                    }
                    lastWorkingTime = workingTime
        
                    entities.waterConsumption.publish(water)
                    entities.gasConsumption.publish(gasM3)
                    entities.workingTime.publish(workingTime)
                    resolve({ workingTime, water, gasM3 }) 
                })
                .catch(error => {
                    logger.error("service:updateConsumption:error", error?.message || error);
                    if (retries < 5) {
                        return setTimeout(() => {
                            device.updateDeviceState(retries + 1)
                        }, 500 * (retries + 1))
                    } else {
                        entities.waterConsumption.updateAvailability(false)
                        entities.gasConsumption.updateAvailability(false)
                        entities.workingTime.updateAvailability(false)
                        reject({
                            message: error?.message || error
                        }) 
                    }
                });
        })
    }

    this.setTargetWaterTemperature = (temperature) => {
        rinnai.setTargetTemperature(temperature)
            .then((state) => device.updateDeviceState())
    }

    this.setPowerState = (mode) => {
        rinnai.setPowerState(mode === "gas")
            .then((state) => device.updateDeviceState())
    }

    return this
}