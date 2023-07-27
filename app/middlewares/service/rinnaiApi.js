/** @param { import('express').Express} app */
module.exports = app => {

    const { round } = app.middlewares.global.utils;

    const getHost = (uri) => {
        let options = app.middlewares.global.options;
        return `http://${options.device_host}${uri}`
    }

    this.consumption = () => {
        let axios = app.middlewares.global.axios;
        let logger = app.middlewares.log.logger;

        return new Promise((resolve, reject) => {
            axios.get(getHost('/consumo'))
                .then(response => {
                    logger.debug(`service:consumption:response`, response.data);
                    let params = response.data.split(',')
                    let [minutes, seconds] = params[0].split(':')
                    let workingTime = (+minutes * 60) + +seconds
                    let water = round(+params[1] / 1000)
                    let gas = round(+params[2] / 9400)
                    resolve({
                        workingTime,
                        water,
                        gas
                    });
                })
                .catch(error => {
                    logger.error("service:consumption:error", error?.message || error);
                    reject({
                        message: 'Falha ao obter o consumo'
                    })
                });
        });
    }
    this.state = () => {
        let axios = app.middlewares.global.axios;
        let logger = app.middlewares.log.logger;

        return new Promise((resolve, reject) => {
            axios.get(getHost('/tela_'))
                .then(response => parseStateParams(response.data))
                .catch(error => {
                    logger.error("service:consumption:error", error?.message || error);
                    reject({
                        message: 'Falha ao obter o consumo'
                    })
                });
        });
    }

    this.deviceParams = () => {
        let axios = app.middlewares.global.axios;
        let logger = app.middlewares.log.logger;

        return new Promise((resolve, reject) => {
            axios.get(getHost('/bus'))
                .then(response => {
                    logger.debug(`service:deviceParams:response`, response.data);
                    let params = response.data.split(",")
                    let targetTemperature = parseRinnaiTemperature(params[18])
                    let inletTemperature = +params[10] / 100
                    let outletTemperature = +params[11] / 100
                    let currentPowerInKCal = +params[9] / 100
                    let powerInkW = round(currentPowerInKCal * 0.014330754)
                    let isPoweredOn = params[0] !== "11"

                    let waterFlow = round(+params[12] / 100)
                    let workingTime = +params[4]
                    resolve({
                        targetTemperature,
                        inletTemperature,
                        outletTemperature,
                        powerInkW,
                        isPoweredOn,
                        waterFlow,
                        workingTime
                    })
                })
                .catch(error => {
                    logger.error("service:consumption:error", error?.message || error);
                    reject({
                        message: 'Falha ao obter o consumo'
                    })
                });
        });
    }

    return this
}