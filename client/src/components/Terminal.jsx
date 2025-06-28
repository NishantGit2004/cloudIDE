import {Terminal as XTerminal} from '@xterm/xterm'
import { useEffect } from 'react'
import { useRef } from 'react'
import '@xterm/xterm/css/xterm.css'

const Terminal = ( { socket } ) => {
    const terminalRef = useRef()
    const isRendered = useRef(false)

    useEffect(() => {
        if (!socket) return

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
    }, [socket])

    return (
        <>
            <div style={{height: '100%'}} ref={terminalRef}></div>
        </>
    )
}

export default Terminal