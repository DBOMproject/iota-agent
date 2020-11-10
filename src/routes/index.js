/** Express router providing index related routes
 * @module route/index
 * @requires express
 */
const express = require('express');

/**
 * Express router to mount index related functions on.
 * @type {object}
 * @const
 * @namespace indexRouter
 */
const router = express.Router();

/* GET home page. */
/**
 * Route serving home page
 * @name get/
 * @function
 * @memberof module:route/index~indexRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
// eslint-disable-next-line no-unused-vars
router.get('/', (req, res, next) => {
  res.send('Chainsource IOTA Agent');
});

module.exports = router;
