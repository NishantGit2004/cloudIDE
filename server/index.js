import http from 'http'
import express from 'express'
import {Server as SocketServer} from 'socket.io'
import path from 'path'
import pty from 'node-pty'
import fs from 'fs/promises'
import os from 'os'
import cors from 'cors'
import chokidar from 'chokidar'

const app = express()
const PORT = 9000

const server = http.createServer(app)
const io = new SocketServer({
    cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
})

app.use(cors())

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'
const cwdPath = path.join(process.env.INIT_CWD || process.cwd(), 'user')

const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: cwdPath,
  env: process.env
})

ptyProcess.onData(data => {
    io.emit('terminal:data', data)
})

io.attach(server)

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.emit('terminal:data')

    socket.on('file:change', async ({ path, content }) => {
        await fs.writeFile(`./user${path}`, content )
    })

    socket.on('terminal:write', (data) => {
        ptyProcess.write(data)
    })
})

chokidar.watch('./user').on('all', (event, path) => {
  io.emit('file:refresh', path)
});

app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./user')
    return res.json({ tree : fileTree })
})

app.get('/files/content', async (req, res) => {
    const path = req.query.path
    const content = await fs.readFile(`./user/${path}`, 'utf-8')
    return res.json({content})
})

server.listen(PORT, () => console.log(`🐋 Docker is running on port ${PORT}`))

const generateFileTree = async (directory) => {
    const tree = {}

    const buildTree = async (currDir, currTree) => {
        const files = await fs.readdir(currDir)

        for (const file of files) {
            const filePath = path.join(currDir, file)
            const stat = await fs.stat(filePath)

            if (stat.isDirectory()) {
                currTree[file] = {}
                await buildTree(filePath, currTree[file])
            } else {
                currTree[file] = null
            }
        }
    }

    await buildTree(directory, tree)
    return tree
}