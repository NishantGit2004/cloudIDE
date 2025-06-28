import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { execSync } from 'child_process'
import pty from 'node-pty'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const ensureDockerContainer = async (projectId) => {
  const containerName = `project_${projectId}`
  const serverRoot = path.join(__dirname, '..')
  const nativePath = path.join(serverRoot, 'projects', projectId)
  let dockerPath = nativePath

  if (os.platform() === 'linux') {
    dockerPath = dockerPath.replace(/\\/g, '/')
    dockerPath = dockerPath.replace(/^([A-Za-z]):/, (_, driveLetter) => {
      return `/mnt/${driveLetter.toLowerCase()}`
    })
  }

  console.log(`Ensuring container for project: ${projectId}`)
  console.log(`nativePath: ${nativePath}`)
  console.log(`dockerPath: ${dockerPath}`)

  await fs.mkdir(nativePath, { recursive: true })

  let containerExists = false

  try {
    execSync(`docker inspect ${containerName}`, { stdio: 'ignore' })
    containerExists = true
  } catch {
    containerExists = false
  }

  if (containerExists) {
    // Check if it's running
    const status = execSync(`docker inspect -f "{{.State.Status}}" ${containerName}`)
      .toString().trim()

    if (status !== 'running') {
      console.log(`Container ${containerName} exists but is not running. Starting...`)
      execSync(`docker start ${containerName}`)
    } else {
      console.log(`Container ${containerName} already running`)
    }
  } else {
    // Container doesn't exist → create it
    try {
      const cmd = `docker run -dit --name ${containerName} -v "${dockerPath}:/workspace" -w /workspace my-ide-node22 bash`
      console.log(`Running: ${cmd}`)
      execSync(cmd)
      console.log(`🛠️  Created and started container ${containerName}`)
    } catch (runError) {
      console.error(`Failed to run container:`, runError.message)
      throw runError
    }
  }

  return { containerName, dockerPath, nativePath }
}

export const createDockerPty = (containerName) => {
  return pty.spawn('docker', ['exec', '-it', containerName, 'bash'], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: path.join(__dirname, '..'),
    env: process.env,
  })
}

export const stopDockerContainer = (containerName) => {
  try {
    execSync(`docker inspect ${containerName}`, { stdio: 'ignore' });

    execSync(`docker stop ${containerName}`);
    console.log(`Stopped container: ${containerName}`);
  } catch (err) {
    if (err.message.includes("No such container")) {
      console.warn(`Container ${containerName} does not exist. Skipping stop.`);
    } else {
      console.error(`Failed to stop container ${containerName}:`, err.message);
    }
  }
}

export const stopAndRemoveDockerContainer = (containerName) => {
  try {
    execSync(`docker inspect ${containerName}`, { stdio: 'ignore' })

    execSync(`docker stop ${containerName}`)
    console.log(`Stopped container: ${containerName}`)
    execSync(`docker rm ${containerName}`)
    console.log(`Removed container: ${containerName}`)
  } catch (err) {
    if (err.message.includes("No such container")) {
      console.warn(`Container ${containerName} does not exist. Skipping removal.`)
    } else {
      console.error(`Failed to stop/remove container ${containerName}:`, err.message)
    }
  }
}