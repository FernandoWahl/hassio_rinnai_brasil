const moment = require("moment-timezone");

/** @param { import('express').Express } app */
module.exports = (app) => {
  const { round, parseStateParams, parseRinnaiTemperature, parseRinnaiError } =
    app.middlewares.global.utils;

  const service = this;

  const getHost = (uri) => {
    let options = app.middlewares.global.options;
    return `http://${options.device_host}${uri}`;
  };

  this.consumption = () => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;

    return new Promise((resolve, reject) => {
      axios
        .get(getHost("/consumo"))
        .then((response) => {
          let params = response.data.split(",");
          let [minutes, seconds] = params[0].split(":");
          let workingTime = +minutes * 60 + +seconds;
          let water = round(+params[1] / 1000);
          let gasM3 = round(+params[2] / 9400);
          resolve({
            workingTime,
            water,
            gasM3,
          });
        })
        .catch((error) => {
          logger.error("service:consumption:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  this.state = () => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;

    return new Promise((resolve, reject) => {
      axios
        .get(getHost("/tela_"))
        .then((response) => parseStateParams(response.data))
        .then((response) => resolve(response))
        .catch((error) => {
          logger.error("service:state:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  this.historic = () => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;

    return new Promise((resolve, reject) => {
      axios
        .get(getHost("/historico"))
        .then((response) => {
          var historic = [];
          response.data.split(";").forEach((line) => {
            let item = line.split(",");
            if (item.length > 2) {
              historic.push({
                usageTime: item[0],
                targetTemperature: parseRinnaiTemperature(+item[1]),
                waterConsumption: +item[2],
                gasM3: round(+item[3] / 9400),
                time: moment.tz(moment.unix(+item[4]), "America/Sao_Paulo"),
              });
            }
          });
          resolve(historic);
        })
        .catch((error) => {
          logger.error("service:historic:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  this.deviceParams = () => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;

    return new Promise((resolve, reject) => {
      axios
        .get(getHost("/bus"))
        .then((response) => {
          let params = response.data.split(",");
          let targetTemperature = parseRinnaiTemperature(params[18]);
          let inletTemperature = +params[10] / 100;
          let outletTemperature = +params[11] / 100;
          let currentPowerInKCal = +params[9] / 100;
          let powerInkW = round(currentPowerInKCal * 0.014330754);
          let isPoweredOn = params[0];

          let waterFlow = round(+params[12] / 100);
          let workingTime = +params[4];
          let standbyTime = +params[5];
          let minWaterFlowInt = round(+params[13] / 100);
          let minWaterFlowStop = round(+params[13] / 100);
          let priorityDeviceConnect =
            params[17] === "null:pri" ? null : params[17].split(":")[0];
          let serialNumber = params[19];
          let ip = params[16];
          let macAddress = params[25];
          let wifiPowerDBm = params[37];
          resolve({
            temperature: {
              target: targetTemperature,
              inlet: inletTemperature,
              outlet: outletTemperature,
            },
            water: {
              waterFlow,
              minWaterFlowInt,
              minWaterFlowStop,
            },
            device: {
              isPoweredOn,
              workingTime,
              standbyTime,
              powerInkW,
              connect: {
                ip,
                priorityDeviceConnect,
                serialNumber,
                macAddress,
                wifiPowerDBm,
              },
            },
          });
        })
        .catch((error) => {
          logger.error("service:deviceParams:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  this.errorHistoric = () => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;

    return new Promise((resolve, reject) => {
      axios
        .get(getHost("/erros"))
        .then((response) => {
          var historic = [];
          response.data.split(";").forEach((line) => {
            let item = line.split(",");
            if (item[0] !== "0" && item[0] !== "") {
              historic.push({
                error: parseRinnaiError(item[0]),
                time: moment.tz(moment.unix(+item[1]), "America/Sao_Paulo"),
              });
            }
          });
          resolve(historic);
        })
        .catch((error) => {
          logger.error("service:errorHistoric:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  // this.priority = (ip) => {
  //     let axios = app.middlewares.global.axios;
  //     let logger = app.middlewares.log.logger;

  //     return new Promise((resolve, reject) => {
  //         axios.get(getHost(`ip:${ip}:pri`))
  //             .then(() => resolve({ priority: true, ip: ip }))
  //             .catch(error => {
  //                 logger.error("service:priority:error", error?.message || error)
  //                 reject({ priority: false, ip: ip })
  //             });
  //     });
  // }

  this.setState = (isOn) => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;
    
    return new Promise((resolve, reject) => {
      service
        .state()
        .then((response) => {
          if (response.isPoweredOn === isOn) {
            resolve(response);
            return;
          }

          axios
            .get(getHost("/lig"))
            .then((response) => parseStateParams(response.data))
            .then((response) => resolve(response))
            .catch((error) => {
              logger.error("service:setState:error",error?.message || erro);
              reject({
                message: "Falha ao obter os dados",
              });
            });
        })
        .catch((error) => {
          logger.error("service:setState:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  this.increaseTemperature = (isOn) => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;
    
    return new Promise((resolve, reject) => {
      service
        .state()
        .then((response) => {
          if (response.isPoweredOn === false) {
            resolve(response);
            return;
          }

          axios
            .get(getHost("/inc"))
            .then((response) => parseStateParams(response.data))
            .then((response) => resolve(response))
            .catch((error) => {
              logger.error("service:increaseTemperature:error",error?.message || erro);
              reject({
                message: "Falha ao obter os dados",
              });
            });
        })
        .catch((error) => {
          logger.error("service:increaseTemperature:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  this.decreaseTemperature = (isOn) => {
    let axios = app.middlewares.global.axios;
    let logger = app.middlewares.log.logger;
    
    return new Promise((resolve, reject) => {
      service
        .state()
        .then((response) => {
          if (response.isPoweredOn === false) {
            resolve(response);
            return;
          }

          axios
            .get(getHost("/dec"))
            .then((response) => parseStateParams(response.data))
            .then((response) => resolve(response))
            .catch((error) => {
              logger.error("service:decreaseTemperature:error",error?.message || erro);
              reject({
                message: "Falha ao obter os dados",
              });
            });
        })
        .catch((error) => {
          logger.error("service:decreaseTemperature:error", error?.message || error);
          reject({
            message: "Falha ao obter os dados",
          });
        });
    });
  };

  return this;
};
