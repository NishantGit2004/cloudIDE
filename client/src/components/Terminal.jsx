import {Terminal as XTerminal} from '@xterm/xterm'
import { useEffect } from 'react'
import { useRef } from 'react'
import socket from '../socket'
import '@xterm/xterm/css/xterm.css'

const Terminal = () => {
    const terminalRef = useRef()
    const isRendered = useRef(false)

    useEffect(() => {
        if (isRendered.current) return 
        isRendered.current = true

        const term = new XTerminal({
            rows: 20
        })
        term.open(terminalRef.current)
        term.onData(data => {
            socket.emit('terminal:write', data)
        })

        const onTermianlData = (data) => {
            term.write(data)
        }

        socket.on('terminal:data', onTermianlData)

        return () => {
            socket.off('termianl:data', onTermianlData)
        }
    })

    return (
        <>
            <div style={{height: '100%'}} ref={terminalRef}></div>
        </>
    )
}

export default Terminal