const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const normalize = require('normalize-url');

// get usermodel
const User = require('../../models/User');

//@route    POST api/users
// @desc    register user
// @access  Public

router.post(
	'/',
	[
		check('name', 'Please enter a valid name').not().isEmpty(),
		check('email', 'Please enter a valid email').isEmail(),
		check(
			'password',
			'Please enter a password with 6 or more characters'
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { name, email, password } = req.body;

		try {
			// See if user exists
			let user = await User.findOne({ email });
			if (user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'user already exists' }] });
			}
			// Get user gravatar

			const avatar = normalize(
				gravatar.url(email, {
					s: '200',
					r: 'pg',
					d: 'mm',
				}),
				{ forceHttps: true }
			);

			user = new User({
				name,
				email,
				avatar,
				password,
			});

			//Encrypt password
			const salt = await bcrypt.genSalt(10);

			user.password = await bcrypt.hash(password, salt);
			await user.save();
			// Retur json webtoken
			const payload = {
				user: {
					id: user.id,
				},
			};
			jwt.sign(
				payload,
				config.get('jwtSecret'),
				{
					expiresIn: 360000,
				},
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err);
			res.status(500).send('Server error');
		}
	}
);

module.exports = router;
