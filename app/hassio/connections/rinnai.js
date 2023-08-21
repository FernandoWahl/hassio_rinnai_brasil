/** @param { import('express').Express } app */
module.exports = app => {

    const rinnai = app.services.rinnai
    const options = app.hassio.config.options;
    const logger = app.middlewares.log.logger;
    const service = this
    const { delay, parseTargetTemperatureToRange } = app.middlewares.global.utils

    let preventUpdate = false
    this.getPreventUpdate = () => preventUpdate
    this.startPreventingUpdates = () => preventUpdate = true
    this.stopPreventingUpdates = () => preventUpdate = false

    this.setPowerState = async (turnOn) => {
        return await rinnai.setState(turnOn)
    }

    this.setTargetTemperature = async (target, lastTargetTemp = undefined, retries = 0) => {
        service.startPreventingUpdates()
        try {
            const targetTemperatureInRange = parseTargetTemperatureToRange(target)
            let currentTargetTemp = +lastTargetTemp
            if (!lastTargetTemp) {
                const { targetTemperature: stateTargetTemp } = await rinnai.state()
                currentTargetTemp = stateTargetTemp
            }
    
            if (targetTemperatureInRange === currentTargetTemp) {
                service.stopPreventingUpdates()
                //await setPriority(false)
                return currentTargetTemp
            }    
            const promiseTemp = currentTargetTemp > targetTemperatureInRange ? rinnai.decreaseTemperature :  rinnai.increaseTemperature
            let response = await promiseTemp()
            currentTargetTemp = response.targetTemperature
            const otherDeviceHasPriority = response.priorityIp !== "null" && response.priorityIp !== options.haIp
            if (otherDeviceHasPriority) {
                logger.debug("[RINNAI API] other device has priority")
                //await setPriority(false)
                service.stopPreventingUpdates()
                return false
            }

            if (targetTemperatureInRange === currentTargetTemp) {
                service.stopPreventingUpdates()
                //await setPriority(false)
                return currentTargetTemp
            }

            await delay(100)

            service.setTargetTemperature(target, currentTargetTemp, 0)
            
        }
        catch (e) {
            logger.error("[RINNAI API] set temperature error", e?.message || e)
            if (retries < 5)
                 return service.setTargetTemperature(target, lastTargetTemp, retries + 1)
            service.stopPreventingUpdates()
            // //await setPriority(false)
            return false
        }
    }
    
    return this
}