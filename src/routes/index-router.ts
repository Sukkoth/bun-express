import { Router } from 'express';
import * as indexController from '@/controllers/index-controller';

const router = Router();

router.get('/', indexController.greet);

export default router;
