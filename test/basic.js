const assert = require('assert')
const express = require('express')
const request = require('supertest')
const PeerList = require('webrtc-signal-http/lib/peer-list')
const capacityRouter = require('../lib')

const appCreator = (peerList) => {
    const router = capacityRouter({
        peerList: peerList
    })
    const app = express()

    app.use(router)

    // for testing, we also further expose peerList
    app.peerList = router.peerList

    return app
}

describe('webrtc-signal-http-capacity', () => {
    describe('http', () => {
        it('should inherit properly', () => {
            const bpl = new PeerList()
            const app = appCreator(bpl)

            const peerId = app.peerList.addPeer('testPeer', {})
            app.peerList.setCapacity(peerId, 10)

            assert.equal(bpl.getPeerIds().length, 1)

            app.peerList.setCapacity(peerId, 0)

            // both formats should yeild the same result
            // ie: capacity is factored in on both
            assert.equal(app.peerList.format(), '')
            assert.equal(bpl.format(), '')
        })

        it('should support capacity', (done) => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})

            request(app)
                .put(`/capacity?peer_id=${peerId}&value=10`)
                .expect(200)
                .then(() => {
                    const list = app.peerList.format()

                    assert.equal(list, 'testPeer (10),1,0\n')
                })
                .then(done,done)
        })

        it('should default to infinite capacity', () => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})
            const list = app.peerList.format()

            assert.equal(list, 'testPeer (infinite),1,0\n')
        })

        it('should disappear from list when capacity hits 0', (done) => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})
            const list = app.peerList.format()
            assert.equal(list, 'testPeer (infinite),1,0\n')

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