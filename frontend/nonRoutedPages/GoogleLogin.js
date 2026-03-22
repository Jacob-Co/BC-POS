import { useContext } from 'react';
import GoogleLogin from 'react-google-login';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';

import UserContext from '../contexts/UserContext';

export default function GoogleLog() {
	const { setUser } = useContext(UserContext);
	const router = useRouter();
	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API;

	async function googleLogin(res) {
		const loginRes = await fetch(`${backendAPI}/api/users/google-login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				googleToken: res.tokenId
			})
		});
		const loginData = await loginRes.json();

		if (loginData.result === false) {
			Swal.fire('Something Went Wrong.', 'Please try again.', 'error');
		}

		const token = loginData.result;

		const userDetailsRes = await fetch(`${backendAPI}/api/users/details`, 
			{
				headers: {
					'Authorization': `Bearer ${token}`
				}
			}
		);

		const userDetailsData = await userDetailsRes.json();
		
		setUser({ token, isAdmin: userDetailsData.isAdmin });
		localStorage.setItem('token', token);

		await Swal.fire('Successful Sign in!', 'See you there.', 'success');
		router.push('/');
	}

	return (
		<GoogleLogin 
			clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
			buttonText="Login Using Google"
			onSuccess={googleLogin}
			onFailure={googleLogin}
			cookiePolicy={'single_host_origin'}
			className="w-100 d-flex justify-content-center"
		/>
	)
}