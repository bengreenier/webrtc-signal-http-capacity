const moment = require('moment')
const express = require('express')
const PeerList = require('webrtc-signal-http/lib/peer-list')

class CapacityPeerList extends PeerList {
    constructor() {
        super()
    }

    static setCapacity(id, value) {
        this._peers[id].capacity = value
    }

    setCapacity(id, value) {
        return CapacityPeerList.setCapacity.apply(this, arguments)
    }

    // override formatter to handle capacity
    static format() {
        // we reverse iterate over the keys because they'll be ordered by id
        // and the latest peer will always have the highest id, and we always
        // want that peer to appear first in the list
        const list = this._peers
        const str = Object.keys(list)
            .reverse()
            .filter(key => {
                let e = list[key]
                return e.capacity === undefined || e.capacity > 0
            })
            .map(key => {
                let e = list[key]
                let name = e.name + ` (${e.capacity || 'infinite'})`
                return `${name},${e.id},${e.status() ? 1 : 0}`
            }).join('\n')

        return str.length > 0 ? str + '\n' : str
    }

    format() {
        return CapacityPeerList.format.apply(this, arguments)
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

    let capacityPeerList

    if (opts.peerList) {
        opts.peerList.setCapacity = CapacityPeerList.setCapacity.bind(opts.peerList)
        opts.peerList.format = CapacityPeerList.format.bind(opts.peerList)
        capacityPeerList = opts.peerList
    } else {
        capacityPeerList = new CapacityPeerList()
    }

    // store the peer list on the router
    router.peerList = capacityPeerList

    router.put('/capacity', (req, res) => {
        const peerId = req.query.peer_id
        const value = req.query.value

        if (!peerId || !value) {
            return res.status(400).end()
        }

        capacityPeerList.setCapacity(peerId, Number.parseInt(value))

        res.status(200).end()
    })

    return router
}