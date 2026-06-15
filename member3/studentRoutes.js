const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentModule,
  deleteStudent,
} = require('../controllers/studentController');

router.route('/').get(getStudents).post(createStudent);

router.route('/:id').get(getStudentById).patch(updateStudent).delete(deleteStudent);

router.patch('/:id/modules/:moduleName', updateStudentModule);

module.exports = router;
