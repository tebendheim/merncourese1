import { combineReducers } from 'redux/lib/redux';
import alert from './alert';
import auth from './auth';

export default combineReducers({
	alert,
	auth,
});
