import http from 'http'
import express from 'express'
import { Server as SocketServer } from 'socket.io'
import fs from 'fs/promises'
import cors from 'cors'
import chokidar from 'chokidar'
import path from 'path'
import { generateFileTree } from './utils/fileTree.js'
import { ensureDockerContainer, createDockerPty, stopDockerContainer } from './docker/containerManager.js'
import connectDB from './db/connectToDB.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import userRoutes from './route/user.route.js'
import projectRoutes from './route/project.route.js'
import { verifyJWT } from './middleware/auth.middleware.js'
import { verify } from 'crypto'
dotenv.config()

const app = express()
const PORT = 9000

const server = http.createServer(app)
const io = new SocketServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

app.use(cookieParser())

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

connectDB()
.then(() => {
    console.log(`Server is started.`)
})
.catch((err) => {
    console.log("MongoDB connection failed !!")
})

io.attach(server)

io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    const projectId = socket.handshake.query.projectId
    const { containerName, nativePath: projectPath, dockerPath } = await ensureDockerContainer(projectId)
    const shell = createDockerPty(containerName)

    socket.emit('terminal:data', '\r\nConnected to Docker container terminal.\r\n')

    shell.on('data', (data) => {
        socket.emit('terminal:data', data.toString())
    })

    shell.on('error', (err) => {
        console.error('Shell error:', err)
    })

    shell.on('exit', (code, signal) => {
        console.log(`Shell exited with code: ${code}, signal: ${signal}`)
    })
    socket.on('terminal:write', (data) => {
        shell.write(data)
    })

    socket.on('file:change', async ({ path: filePath, content }) => {
        const absolutePath = path.join(projectPath, filePath)
        await fs.writeFile(absolutePath, content)
    })
    
    chokidar.watch(projectPath).on('all', (event, filePath) => {
        socket.emit('file:refresh', filePath)
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`)

        if (shell) {
            try {
                shell.kill()
            } catch (err) {
                console.error('Error killing shell:', err)
            }
        }
        stopDockerContainer(containerName)
    })
})

// user routes
app.use('/api/user', userRoutes)

// Project Routes
app.use('/api/project', projectRoutes)

// Fetch the file tree
app.get('/files', verifyJWT, async (req, res) => {
  const projectId = req.query.projectId
  if (!projectId) return res.status(400).json({ error: 'projectId required' })

  const baseDir = path.join('projects', projectId)

  try {
    await fs.access(baseDir) 
  } catch (err) {
    return res.status(404).json({ error: 'Project directory does not exist yet' })
  }

  try {
    const fileTree = await generateFileTree(baseDir)
    return res.json({ tree: fileTree })
  } catch (err) {
    console.error('Failed to read directory:', baseDir, err.message)
    return res.status(500).json({ error: 'Failed to read directory' })
  }
})

// Get file content
app.get('/files/content', verifyJWT, async (req, res) => {
    const projectId = req.query.projectId
    const filePath = req.query.path
    
    if (!projectId || !filePath) {
        return res.status(400).json({ error: 'projectId and path required' })
    }

    const baseDir = path.join('projects', projectId)
    const fullPath = path.join(baseDir, filePath)
    
    try {
        const content = await fs.readFile(fullPath, 'utf-8')
        return res.json({ content })
    } catch (err) {
        return res.status(500).json({ error: 'File read error', message: err.message })
    }
})

server.listen(PORT, () => console.log(`🐋 Docker terminal server running on port ${PORT}`))