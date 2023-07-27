/** @param { import('express').Express } app */
module.exports = app => {

    let rinnaiApi = app.middlewares.service.rinnaiApi;

    this.consumption = () => {
        return new Promise((resolve, reject) => {
          rinnaiApi.consumption()
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
    }
    return this
};