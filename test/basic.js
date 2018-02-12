const assert = require('assert')
const express = require('express')
const request = require('supertest')
const capacityRouter = require('../lib')

const appCreator = (timeoutPeriod, gcInterval) => {
    const router = capacityRouter({
        timeoutPeriod: timeoutPeriod,
        gcInterval: gcInterval
    })
    const app = express()

    app.use(router)

    // for testing, we also further expose peerList
    app.peerList = router.peerList

    return app
}

describe('webrtc-signal-http-capacity', () => {
    describe('http', () => {
        it('should support capacity', (done) => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})

            request(app)
                .put(`/capacity?peer_id=${peerId}&value=10`)
                .expect(200)
                .then(() => {
                    const list = app.peerList.format()

                    assert.equal(list, 'testPeer (10),1,0')
                })
                .then(done,done)
        })

        it('should default to infinite capacity', () => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})
            const list = app.peerList.format()

            assert.equal(list, 'testPeer (infinite),1,0')
        })

        it('should disappear from list when capacity hits 0', (done) => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})
            const list = app.peerList.format()
            assert.equal(list, 'testPeer (infinite),1,0')

            request(app)
                .put(`/capacity?peer_id=${peerId}&value=0`)
                .expect(200)
                .then(() => {
                    const list = app.peerList.format()

                    assert.equal(list, '')
                })
                .then(done,done)
        })
    })
})