import { Project } from '../model/project.model.js'
import { ensureDockerContainer, stopDockerContainer, stopAndRemoveDockerContainer } from '../docker/containerManager.js'
import fs from 'fs/promises'
import path from 'path'
import mongoose from 'mongoose'

export const createProject = async (req, res) => {
  try {
    console.log("Create Request")
    const { projectName } = req.body
    const ownerId = req.user._id
    console.log(projectName)

    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' })
    }

    // Step 1: Create project in DB with placeholder path
    const newProject = await Project.create({
      projectName,
      path: 'placeholder',
      ownerId
    })

    // Step 2: Create container
    const { nativePath, containerName } = await ensureDockerContainer(newProject._id.toString())

    await stopDockerContainer(containerName)

    // Step 3: Update the project path
    newProject.path = nativePath
    await newProject.save()

    return res.status(201).json({
      message: 'Project created and container started',
      project: {
        _id: newProject._id,
        projectName: newProject.projectName,
        path: newProject.path
      }
    })
  } catch (err) {
    console.error('Error in createProject:', err)
    return res.status(500).json({
      message: 'Failed to create project',
      error: err.message
    })
  }
}

export const getAllProjects = async (req, res) => {
  try {
    const ownerId = req.user._id
    const projects = await Project.find({ ownerId })
      .select('projectName _id createdAt')
      .sort({ createdAt: -1 })
    
    res.status(200).json({ projects })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: err.message })
  }
}

export const openProject = async (req, res) => {
  try {
    const { id: projectId } = req.params
    const ownerId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    const project = await Project.findOne({ _id: projectId, ownerId })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const containerName = `project_${projectId}`
    await ensureDockerContainer(containerName)

    return res.status(200).json({
      message: 'Project ready',
      project,
      container: containerName
    })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to open project', error: err.message })
  }
}

export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id
    const ownerId = req.user._id

    const project = await Project.findOne({ _id: projectId, ownerId })

    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' })
    }

    const projectFolder = path.join(process.cwd(), 'projects', projectId)

    await stopAndRemoveDockerContainer(`project_${projectId}`)

    await fs.rm(projectFolder, { recursive: true, force: true })

    await project.deleteOne()

    return res.status(200).json({ message: 'Project deleted successfully' })
  } catch (err) {
    console.error('Error deleting project:', err.message)
    return res.status(500).json({ message: 'Error deleting project', error: err.message })
  }
}
