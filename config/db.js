const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDb = async () => {
	try {
		await mongoose.connect(db, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
			useFindAndModify: false,
		});
		console.log('mongoDB is connected');
	} catch (err) {
		console.log(err.message);
		// exit on failiure
		process.exit(1);
	}
};
module.exports = connectDb;
