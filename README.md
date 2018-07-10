# webrtc-signal-http-capacity

[![Build Status](https://travis-ci.org/bengreenier/webrtc-signal-http-capacity.svg?branch=master)](https://travis-ci.org/bengreenier/webrtc-signal-http-capacity)

[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/) [![Greenkeeper badge](https://badges.greenkeeper.io/bengreenier/webrtc-signal-http-capacity.svg)](https://greenkeeper.io/)

[webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http) capacity management extension :recycle: :fuelpump:

![logo gif](./readme_example.gif)

This adds an additional signal message to help servers communicate capacity constraints. Once capacity is reached, clients will no longer see said server in the [PeerList](https://github.com/bengreenier/webrtc-signal-http#peerlist).

## Getting started

> Learn about the [RESTful API extension](#restful-api) via the OpenAPI doc ([raw](./swagger.yml) or [hosted](https://rebilly.github.io/ReDoc/?url=https://raw.githubusercontent.com/bengreenier/webrtc-signal-http-capacity/master/swagger.yml)) to understand how clients should change their interaction with the service when using this extension.

To install a signal server including this extension that can be used in a cli `npm install -g webrtc-signal-http-capacity`. To run it, just use `webrtc-signal-http-capacity` from the command line, using the `PORT` environment variable to configure it's listening port.

To consume this server in combination with [webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http) and other possible extensions, `npm install webrtc-signal-http webrtc-signal-http-capacity` and then run some code like the following:

```
const express = require('express')
const signalRouterCreator = require('webrtc-signal-http')
const capacityRouterCreator = require('webrtc-signal-http-capacity')

const app = express()
const capacityRouter = capacityRouterCreator()
const signalRouter = signalRouterCreator({
    peerList: capacityRouter.peerList
})

app.use(signalRouter, capacityRouter)

app.get('/new-endpoint', (req, res) => { res.send('hello') })

app.listen(process.env.PORT || 3000)
```

## RESTful API

To understand the base API provided by [webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http), look at the [docs for that project](https://github.com/bengreenier/webrtc-signal-http#restful-api). This documents the API endpoints this extension adds. :sparkles:

### PUT /capacity

> Takes `peer_id`, `value` query parameters

Indicates server capacity has changed. This endpoint is expected to be called at by the server as capacity changes (usually as peers connect). The `value` parameter should be an integer approaching `0`. `0` indicates the server is full. The response will be empty.

```
PUT http://localhost:3000/capacity?peer_id=1&value=10 HTTP/1.1
Host: localhost:3000

=>

HTTP/1.1 200 OK
Content-Length: 0
```

## Extension API

To understand the base API provided by [webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http), look at the [docs for that project](https://github.com/bengreenier/webrtc-signal-http#extension-api). This documents the javascript API this extension adds. :sparkles:

### module.exports

> This is the exported behavior, you access it with `require('webrtc-signal-http-capacity')`

[Function] - takes a [CapacityOpts](#capacityopts) indicating configuration options. __Returns__ an [express](https://expressjs.com/) `router` object.

#### router.peerList

[Object] - can be used to retrieve a `PeerList` from the express `router`. __Returns__ a [CapacityPeerList](#capacitypeerlist) object.

### CapacityPeerList

[Class] - Extends [PeerList](https://github.com/bengreenier/webrtc-signal-http/#peerlist) with the ability to have full peers (that aren't visible in listings).

### CapacityOpts

[Object] - represents the options that can be given to the capacity creator

#### peerList

[Object] - An existing PeerList to base our [CapacityPeerList](#capacitypeerlist) on.

## License

MIT