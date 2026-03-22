import FetchHelper from './fetchHelper';
const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;

async function getUserDetails(token) {
	const userDetails = await FetchHelper
		.baseFetch(`${backendAPI}/api/users/details`, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
	return userDetails.result;
}

async function login(loginCredentials) {
	// loginCredentials is an obj with prop email and password
	const loginRes = await FetchHelper
		.baseFetch(`${backendAPI}/api/users/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(loginCredentials) 
		});
	return loginRes.result;
}

export default {
	getUserDetails,
	login
}