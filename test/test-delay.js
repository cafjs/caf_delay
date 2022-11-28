"use strict"

const hello = require('./hello/main.js');
const app = hello;

const caf_core= require('caf_core');
const caf_comp = caf_core.caf_components;
const myUtils = caf_comp.myUtils;
const async = caf_comp.async;
const cli = caf_core.caf_cli;

const crypto = require('crypto');

const APP_FULL_NAME = 'root-delay';

const CA_OWNER_1='me'+ crypto.randomBytes(8).toString('hex');
const CA_LOCAL_NAME_1='ca1';
const FROM_1 =  CA_OWNER_1 + '-' + CA_LOCAL_NAME_1;
const FQN_1 = APP_FULL_NAME + '#' + FROM_1;

process.on('uncaughtException', function (err) {
               console.log("Uncaught Exception: " + err);
               console.log(myUtils.errToPrettyStr(err));
               process.exit(1);

});

const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

module.exports = {
    setUp(cb) {
       var self = this;
        app.init( {name: 'top'}, 'framework.json', null,
                      function(err, $) {
                          if (err) {
                              console.log('setUP Error' + err);
                              console.log('setUP Error $' + $);
                              // ignore errors here, check in method
                              cb(null);
                          } else {
                              self.$ = $;
                              cb(err, $);
                          }
                      });
    },
    tearDown(cb) {
        var self = this;
        if (!this.$) {
            cb(null);
        } else {
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    async delayMethod(test) {
        const from1 = FROM_1;
        test.expect(9);
        try {
            let s1 = new cli.Session('ws://root-delay.localtest.me:3000',
                                     from1, {
                                         from : from1
                                     });
            let p = await new Promise((resolve, reject) => {
                s1.onopen = async function() {
                    try {
                        // 1. test NO cancelation

                        let res = await s1.schedule(5, 1).getPromise();
                        console.log(res);
                        test.ok(typeof res === 'string');

                        res = await s1.getState().getPromise();
                        console.log(res);
                        test.ok(Object.keys(res.pending).length === 1);
                        test.ok(res.counter === 0);

                        await s1.schedule(5, 1).getPromise();
                        await s1.schedule(5, 1).getPromise();
                        await s1.schedule(5, 1).getPromise();

                        await setTimeoutPromise(6000);
                        res = await s1.getState().getPromise();
                        console.log(res);
                        test.ok(res.counter === 4);

                        // 2. test cancelation

                        await s1.schedule(5, 1).getPromise();
                        res = await s1.schedule(5, 3).getPromise();
                        await s1.schedule(5, 1).getPromise();
                        console.log(res);
                        test.ok(typeof res === 'string');

                        res = await s1.cancel(res).getPromise();
                        console.log(res);
                        test.ok(Object.keys(res.pending).length === 2);
                        test.ok(res.counter === 4);


                        await setTimeoutPromise(6000);

                        res = await s1.getState().getPromise();
                        console.log(res);
                        test.ok(res.counter === 6);

                        resolve(res);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        reject(err);
                    }
                };
                return [];
            });

            p = await new Promise((resolve, reject) => {
                s1.onclose = function(err) {
                    test.ifError(err);
                    resolve(null);
                };
                s1.close();
            });
            test.done();
        } catch (err) {
            test.ifError(err);
            test.done();
        }
    },

    async repeatMethod(test) {
        const from1 = FROM_1;
        test.expect(9);
        try {
            let s1 = new cli.Session('ws://root-delay.localtest.me:3000',
                                     from1, {
                                         from : from1
                                     });
            let p = await new Promise((resolve, reject) => {
                s1.onopen = async function() {
                    try {
                        // 1. test NO cancelation
                        // repeat 5 times, one every second
                        let res = await s1.scheduleRepeat(1, 1, 1, 5)
                            .getPromise();
                        console.log(res);
                        test.ok(typeof res === 'string');

                        res = await s1.getState().getPromise();
                        console.log(JSON.stringify(res));
                        test.ok(Object.keys(res.pending).length === 1);
                        test.ok(res.counter === 6);

                        await setTimeoutPromise(7000);
                        res = await s1.getState().getPromise();
                        console.log(`RESULT: ${JSON.stringify(res)}`);
                        test.ok(res.counter === 11);

                        // 2. test cancelation

                        res = await s1.scheduleRepeat(1, 3, 1, 5)
                            .getPromise();
                        console.log(res);
                        test.ok(typeof res === 'string');

                        res = await s1.cancel(res).getPromise();
                        console.log(res);
                        test.ok(Object.keys(res.pending).length === 0);
                        test.ok(res.counter === 11);

                        await setTimeoutPromise(7000);

                        res = await s1.getState().getPromise();
                        console.log(`RESULT: ${JSON.stringify(res)}`);
                        test.ok(res.counter === 11);

                        resolve(res);
                    } catch (err) {
                        test.ok(false, 'Got exception ' + err);
                        reject(err);
                    }
                };
                return [];
            });

            p = await new Promise((resolve, reject) => {
                s1.onclose = function(err) {
                    test.ifError(err);
                    resolve(null);
                };
                s1.close();
            });
            test.done();
        } catch (err) {
            test.ifError(err);
            test.done();
        }
    }
};
