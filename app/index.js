require('dotenv').config()
const express = require('express')
const consign = require('consign')
const app = express()

app.disable('x-powered-by')

consign({
		cwd: 'app',
		verbose: process.env.APP_DEBUG === 'true' || false,
		locale: 'pt-br'
	})
    .include('./middlewares/log')
	.then('./middlewares/global')
	.then('./services')
	.then('./controllers')
	.then('./routes')
	.into(app)

let logger = app.middlewares.log.logger;
app.listen(process.env.APP_PORT || 40002, () => {
	logger.debug(`Server running on http://homeassistant.local:${process.env.APP_PORT || 40002}`);
	logger.debug(`GET http://homeassistant.local:${process.env.APP_PORT || 40002}${process.env.APP_PREFIX}`);
})
