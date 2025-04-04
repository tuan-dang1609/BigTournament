import express from 'express';
import {
  test,
  updateUser,
  deleteUser,
  getUser
} from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

router.get('/', test);
router.post('/update/:id',updateUser,verifyToken );
router.get('/:id',getUser,verifyToken)
router.delete('/delete/:id', deleteUser,verifyToken );
export default router;
