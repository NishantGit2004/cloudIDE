import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
} from '../controller/user.controller.js'
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshAccessToken);

export default router