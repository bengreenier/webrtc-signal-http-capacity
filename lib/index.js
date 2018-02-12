const moment = require('moment')
const express = require('express')
const PeerList = require('webrtc-signal-http/lib/peer-list')

class CapacityPeerList extends PeerList {
    constructor(existingPeerList) {
        super()
        
        // copy over existing peers if any
        if (existingPeerList) {
            this._peers = existingPeerList._peers || {}
        }
    }

    setCapacity(id, value) {
        this._peers[id].capacity = value
    }

    // override formatter to handle capacity
    format() {
        // we reverse iterate over the keys because they'll be ordered by id
        // and the latest peer will always have the highest id, and we always
        // want that peer to appear first in the list
        return Object.keys(this._peers)
            .reverse()
            .filter(key => {
                let e = this._peers[key]
                return !e.capacity || e.capacity > 0
            })
            .map(key => {
                let e = this._peers[key]
                let name = e.name + ` (${e.capacity || 'infinite'})`
                return `${name},${e.id},${e.status() ? 1 : 0}`
            }).join('\n')
    }

    get fullList() {
        const fullList = new PeerList()
        fullList._nextPeerId = this._nextPeerId
        fullList._peers = this._peers

        return fullList
    }
}

module.exports = (opts) => {
    opts = opts || {}
    
    const router = express.Router()
    
    // abstracted peer message sender logic
    // this will direct send if possible, otherwise
    // it will buffer into the peerList
    const sendPeerMessage = (srcId, destId, data) => {
        // find the current peer
        const peer = router.peerList.getPeer(destId)

        if (peer.status()) {
            peer.res
                .status(200)
                .set('Pragma', srcId)
                .send(data)
        }
        // otherwise we buffer
        else {
            router.peerList.pushPeerData(srcId, destId, data)
        }
    }

    const capacityPeerList = opts.peerList = new CapacityPeerList(opts.peerList || null)
    
    // store the peer list on the router
    router.peerList = capacityPeerList

    router.put('/capacity', (req, res) => {
        const peerId = req.query.peer_id
        const value = req.query.value

        if (!peerId || !value) {
            return res.status(400).end()
        }

        capacityPeerList.setCapacity(peerId, value)

        res.status(200).end()
    })

    return router
}