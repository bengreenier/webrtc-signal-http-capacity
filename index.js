#!/usr/bin/env node
const express = require('express')
const signalRouterCreator = require('webrtc-signal-http')
const capacityRouterCreator = require('./lib')

const app = express()
const capacityRouter = capacityRouterCreator()
const signalRouter = signalRouterCreator({
    peerList: capacityRouter.peerList,
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true
})
app.use(signalRouter, capacityRouter).listen(process.env.PORT || 3000)