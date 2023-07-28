/** @param { import('express').Express} app */
module.exports = app => {
    const AVAILABLE_TEMPERATURES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 48, 50, 55, 60]
    const RINNAI_STATE_TEMPERATURES = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, null, 48, null, 50, 55, 60]
    const RINNAI_ERROR = {
        "02": "Desligamento pelo timer (60 minutos)",
        "10": "Problema na ventoinha ou obstrução no fluxo",
        "11": "Ao ligar não acende ( falta gás,...).",
        "12": "Falta de gás durante o uso",
        "14": "Fusível ou termostato rompido",
        "16": "Alta temperatura da água",
        "19": "Fiação está em curto, fuga de corrente.",
        "32": "Termistor com problema",
        "52": "Válvula modulador de gás (POV) com problema.",
        "61": "Conector da ventoinha solto (RPM)",
        "71": "Válvula solenóide com problema de acionamento",
        "72": "Sensor de chama com problema",
        "90": "Ao ligar não aciona a ventoinha",
        "99": "Ventoinha com problema",
    }

    const service = this

    this.parseTargetTemperatureToRange = (temperature) => {
        let newTargetTemperature = AVAILABLE_TEMPERATURES.includes(temperature) ? temperature : undefined
        if (!newTargetTemperature) {
            newTargetTemperature = AVAILABLE_TEMPERATURES.find((_, index) => {
                let nextAvailable = AVAILABLE_TEMPERATURES[index + 1]
                return nextAvailable > temperature
            })
        }

        if (!newTargetTemperature) {
            let lowestTemp = AVAILABLE_TEMPERATURES[0]
            let highestTemp = AVAILABLE_TEMPERATURES[AVAILABLE_TEMPERATURES.length - 1]
            if (temperature < lowestTemp) newTargetTemperature = lowestTemp
            if (temperature > highestTemp) newTargetTemperature = highestTemp
        }
        return newTargetTemperature
    }

    this.parseRinnaiError = (error) => {
        console.log(String(error));
        return RINNAI_ERROR[String(error)]
    }


    this.parseRinnaiTemperature = (rinnaiTemp) => {
        let index = +rinnaiTemp - 3
        return RINNAI_STATE_TEMPERATURES[index]
    }

    this.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    this.round = (number, places = 2) => +number.toFixed(places)
    this.parseStateParams = (stringifiedParams) => {
        let params = stringifiedParams.split(',')
        let targetTemperature = service.parseRinnaiTemperature(params[7])
        let isHeating = params[2] === '1'
        let priorityDeviceConnect = params[6].split(":")[0]
        let isPoweredOn = params[0] !== "11"
        let workingTime = +params[3]
        let standbyTime = +params[4]
    
        return {
            targetTemperature,
            isHeating,
            isPoweredOn,
            priorityDeviceConnect,
            workingTime,
            standbyTime,
        }
    }
    return this
}