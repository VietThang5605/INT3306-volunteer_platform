const express = require('express');
const router = express.Router();

const { auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { userIdSchema } = require('../../validators/user.validator');
const profileController = require('../../controllers/profileController');

router.use(auth);

router.get(
  '/:id',
  validate(userIdSchema, 'params'), // Validate ID trên URL
  profileController.getProfile
);

module.exports = router;