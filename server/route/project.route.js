import express from 'express'
import { verifyJWT } from '../middleware/auth.middleware.js'
import {
  createProject,
  getAllProjects,
  openProject,
  deleteProject
} from '../controller/project.controller.js'

const router = express.Router()

router.use(verifyJWT)

router.post('/create', createProject)
router.get('/', getAllProjects)
router.get('/:id', openProject)
router.delete('/:id', deleteProject)

export default router