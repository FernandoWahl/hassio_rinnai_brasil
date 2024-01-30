/** @param { import('express').Express } app */
module.exports = app => {
    let options = app.hassio.config.options;
    let mqttClient = app.hassio.connections.mqtt;
    
    const deviceIdPrefix = `rinnai_br_${options.device.serialNumber}_`

    const haDevice = {
        identifiers: [
            options.device.serialNumber
        ],
        manufacturer: 'Rinnai Brasil',
        model: options.device.model,
        name: `Rinnai ${options.device.model} (${options.device.serialNumber})`,
    }

    const getEntityTopic = (component, objectId, action) => `homeassistant/${component}/${deviceIdPrefix}${objectId}/${action}`
    const createEntity = (component, objectId, config) => {
        const extendedConfig = {
            ...config,
            object_id: `${deviceIdPrefix}${objectId}`,
            state_topic: getEntityTopic(component, objectId, 'state'),
            unique_id: `${deviceIdPrefix}${objectId}`,
            availability: {
                payload_available: 'online',
                payload_not_available: 'offline',
                topic: getEntityTopic(component, objectId, 'availability')
            },
            device: haDevice
        }

        const updateAvailability = (isAvailable) => {
            mqttClient.publish(getEntityTopic(component, objectId, 'availability'), isAvailable ? 'online' : 'offline')
        }

        const publish = (data, action = 'state') => {
            mqttClient.publish(getEntityTopic(component, objectId, action), String(data))
            updateAvailability(true)
        }

        const publishAttributes = (attributes) => {
            mqttClient.publish(getEntityTopic(component, objectId, 'attributes'), String(JSON.stringify(attributes)))
            updateAvailability(true)
        }

        mqttClient.publish(getEntityTopic(component, objectId, 'config'), JSON.stringify(extendedConfig))
        updateAvailability(true)
    
        return {
            publish,
            publishAttributes,
            updateAvailability
        }
    }

    const createWaterHeaterEntity = (objectId, config) => {
        const component = 'water_heater';
        const extendedConfig = {
            ...config,
            object_id: `${deviceIdPrefix}${objectId}`,
            modes: [
                "off",
                "gas",
            ],
            mode_state_topic: getEntityTopic(component, objectId, 'mode'),
            mode_command_topic: getEntityTopic(component, objectId, 'mode/set'),
            mode_command_template: '{{ value if value=="off" else "gas" }}',
            temperature_state_topic: getEntityTopic(component, objectId, 'temperature'),
            temperature_command_topic: getEntityTopic(component, objectId, 'temperature/set'),
            current_temperature_topic: getEntityTopic(component, objectId, 'temperature/current'),
            json_attributes_topic: getEntityTopic(component, objectId, 'attributes'),
            step: 1,
            unique_id: `${deviceIdPrefix}${objectId}`,
            precision: 0.1,
            min_temp: 35,
            max_temp: 60, 
            temperature_unit: 'C',
            availability: {
                payload_available: 'online',
                payload_not_available: 'offline',
                topic: getEntityTopic(component, objectId, 'availability')
            },
            device: haDevice
        }
    
        const updateAvailability = (isAvailable) => {
            mqttClient.publish(getEntityTopic(component, objectId, 'availability'), isAvailable ? 'online' : 'offline')
        }

        const publish = (data, action = 'state') => {
            mqttClient.publish(getEntityTopic(component, objectId, action), String(data))
            updateAvailability(true)
        }

        const publishAttributes = (attributes) => {
            mqttClient.publish(getEntityTopic(component, objectId, 'attributes'), String(JSON.stringify(attributes)))
            updateAvailability(true)
        }

        mqttClient.publish(getEntityTopic(component, objectId, 'config'), JSON.stringify(extendedConfig))
        updateAvailability(true)

        return {
            publish,
            publishAttributes,
            updateAvailability,
            mode_command_topic: extendedConfig.mode_command_topic,
            temperature_command_topic: extendedConfig.temperature_command_topic,

        }
    }

    this.initConfig = function () {
        let logger = app.middlewares.log.logger;
        logger.debug(`entities:initConfig:init`)
        this.waterHeater = createWaterHeaterEntity('water_heater', {
            icon: "mdi:water-boiler",
            name: `Aquecedor ${options.device.model}`
        });
    
        this.inletWaterTemperature = createEntity('sensor', 'inlet_water_temperature', {
            device_class: 'temperature',
            icon: 'mdi:water-thermometer-outline',
            name: 'Temperatura de entrada',
            unit_of_measurement: '°C'
        })
        
        this.outletWaterTemperature = createEntity('sensor', 'outlet_water_temperature', {
            device_class: 'temperature',
            icon: 'mdi:water-thermometer',
            name: 'Temperatura de saída',
            unit_of_measurement: '°C'
        })
        
        this.heatingState = createEntity('binary_sensor', 'heating_state', {
            device_class: 'power',
            icon: 'mdi:fire',
            name: 'Aquecendo água',
        })
    
        this.waterFlow = createEntity('sensor', 'water_flow', {
            icon: 'mdi:water',
            name: 'Fluxo de água',
            unit_of_measurement: 'L/min'
        })
        
        this.power = createEntity('sensor', 'heating_power', {
            device_class: 'power',
            icon: 'mdi:fire',
            name: 'Potência',
            unit_of_measurement: 'kW'
        })
        
        this.gasConsumption = createEntity('sensor', 'gas_consumption', {
            device_class: 'gas',
            icon: 'mdi:meter-gas-outline',
            name: 'Consumo total de gás',
            unit_of_measurement: 'm³',
            state_class: 'total_increasing'
        })
        
        this.waterConsumption = createEntity('sensor', 'water_consumption', {
            device_class: 'volume',
            icon: 'mdi:water-plus-outline',
            name: 'Consumo total de água',
            unit_of_measurement: 'm³',
            state_class: 'total_increasing',
        })
        
        this.workingTime = createEntity('sensor', 'working_time', {
            device_class: 'duration',
            icon: 'mdi:timer',
            name: 'Total de tempo em aquecimento',
            unit_of_measurement: 's',
            state_class: 'total_increasing'
        })
    
        this.wifiSignal = createEntity('sensor', 'wifi_signal_strength', {
            icon: 'mdi:wifi',
            name: 'Potência do sinal wifi',
            device_class: 'signal_strength',
            unit_of_measurement: 'dBm'
        })

        logger.debug(`entities:initConfig:end`)
    }

    this.initConfig()

    return this
}