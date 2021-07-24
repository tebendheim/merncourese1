// @Todo - må sjekke om database fungerer når jeg har oppdatert JWT secret

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   PUT api/profile/experience/update
// @desc    Add profile experience
// access   Private
// @Todo -  Denne bruker samme metode som POST api/profile for å oppdatere..
router.put('/experience/:exp_id', auth, async (req, res) => {
	try {
		const {
			title, // Dette betyr det samme som under
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body;

		const experienceFields = {};
		experienceFields.user = req.user.id;
		experienceFields.experience = {};
		if (title) experienceFields.experience.title = title;
		if (company) experienceFields.experience.company = company;
		if (location) experienceFields.experience.location = location;
		if (from) experienceFields.experience.from = from;
		if (to) experienceFields.experience.to = to;
		if (current) experienceFields.experience.current = current;
		if (description) experienceFields.experience.description = description;

		let profile = await Profile.findOne({
			user: req.user.id,
		});
		console.log(profile);
		const index = profile.experience.indexOf({ _id: req.params.exp_id });
		const newExp = [...profile.experience];
		// console.log(newExp[index]);
		newExp[index] =  {title: 'LOL}'} ;
		profile.set({
			experience: newExp,
		});
		console.log(newExp);
		// console.log(index);
		// console.log(profile.experience);
		// profile.experience.unshift(
		// 	{ _id: req.params.exp_id },
		// 	{ $set: experienceFields.experience },
		// 	{ new: true }
		// );
		profile.save();
		res.json(profile);
	} catch (err) {
		console.log(err);
		res.status(500).send('Server error');
	}
});



//@route    GET api/profile/me
// @desc    get current profile
// @access  Public

router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate(
			'user',
			['name', 'avatar']
		);

		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('Server error');
	}
});

//@route    POST api/profile
// @desc    create or udate a user profile
// @access  Private

router.post(
	'/',

	auth,
	[
		check('status', 'Status is required').not().isEmpty(),
		check('skills', 'skills is required').not().isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin,
		} = req.body;

		// build profile object
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map((skill) => skill.trim());
		}

		// build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (facebook) profileFields.social.facebook = facebook;
		if (instagram) profileFields.social.instagram = instagram;
		if (twitter) profileFields.social.twitter = twitter;
		if (linkedin) profileFields.social.linkedin = linkedin;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			// update
			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);

				return res.json(profile);
			}

			// create
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route   GET api/profile
// @desc    get all profiles
// access   Public

router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});

// @route   GET api/profile/user/:user_id
// @desc    get profile by user ID
// access   Public

router.get('/user/:user_id', async (req, res) => {
	// mangler å lage Postman get request for denne
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'Profile not found' });
		}
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found' });
		}
		res.status(500).send('Server error');
	}
});

// @route   DELETE api/profile
// @desc    delete profile, user & posts
// access   Private
router.delete('/', auth, async (req, res) => {
	// mangler å lage Postman get request for denne
	try {
		// @todo - remove users posts
		// remove profile
		await Profile.findOneAndRemove({ user: req.user.id });
		// remove User
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: 'User deleted' });
	} catch (err) {
		console.error(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found' });
		}
		res.status(500).send('Server error');
	}
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// access   Private
// @route   PUT api/profile/education
// @desc    Add profile education
// access   Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From date is required and needs to be from the past.')
				.not()
				.isEmpty()
				.custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(500).json({ errors: errors.array() });
		}
		const { title, company, from, to, current, description } = req.body;

		const newExp = {
			title,
			company,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.experience.unshift(newExp);
			//unshift er det samme som push, men legger det til i starten i steden for i slutten

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.log(err);
			res.status(500).send('Server error');
		}
	}
);
// @route   DELETE api/profile/experience/:exp_id
// @desc    Update experience
// access   Private
router.delete('/profile/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		//Get remove index
		const removeIndex = profile.experience
			.map((item) => item.id)
			.indexOf(req.params.exp_id);
		profile.experience.splice(removeIndex, 1);

		await profile.save();

		console.log(removeIndex);
		res.json(profile);
	} catch (err) {
		console.log(err);
		res.status(500).send('server error');
	}
});

// @route   PUT api/profile/education
// @desc    Add profile education
// access   Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'school is required').not().isEmpty(),
			check('degree', 'Degree is required').not().isEmpty(),
			check('fieldofstudy', 'Fielt of study is required').not().isEmpty(),
			check('from', 'From date is required and needs to be from the past.')
				.not()
				.isEmpty()
				.custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(500).json({ errors: errors.array() });
		}
		const { school, degree, fieldofstudy, from, to, current, description } =
			req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.education.unshift(newEdu);
			//unshift er det samme som push, men legger det til i starten i steden for i slutten

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.log(err);
			res.status(500).send('Server error');
		}
	}
);

// @route   PUT api/profile/education
// @desc    Add profile education
// access   Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'school is required').not().isEmpty(),
			check('degree', 'Degree is required').not().isEmpty(),
			check('fieldofstudy', 'Fielt of study is required').not().isEmpty(),
			check('from', 'From date is required and needs to be from the past.')
				.not()
				.isEmpty()
				.custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(500).json({ errors: errors.array() });
		}
		const { school, degree, fieldofstudy, from, to, current, description } =
			req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			profile.education.unshift(newEdu);
			//unshift er det samme som push, men legger det til i starten i steden for i slutten

			await profile.save();

			res.json(profile);
		} catch (err) {
			console.log(err);
			res.status(500).send('Server error');
		}
	}
);
// @route   DELETE api/profile/education/:edu_id
// @desc    Update Education
// access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		//Get remove index
		const removeIndex = profile.education
			.map((item) => item.id)
			.indexOf(req.params.exp_id);

		profile.education.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (err) {
		console.log(err);
		res.status(500).send('server error');
	}
});

// @route   GET api/profile/github/:username
// @desc    get user repos from github
// access   Public
router.get('/github/:username', async (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created:asc&client_id=${config.get(
				'githubClientId'
			)}&client_secret=${config.get('githubSecret')}`,
			method: 'GET',
			headers: { 'user-agent': 'node.js' },
		};
		request(options, (error, response, body) => {
			if (error) console.log(error);

			if (response.statusCode !== 200) {
				return res.status(404).json({ msg: 'No Github profile found' });
			}
			res.json(JSON.parse(body));
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});

module.exports = router;
