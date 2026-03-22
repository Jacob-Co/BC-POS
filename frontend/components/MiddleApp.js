import { useContext, useState } from 'react';
import { Spinner } from 'react-bootstrap';

import UserContext from '../contexts/UserContext';

import Login from '../nonRoutedPages/Login';
import GoogleLogin from '../nonRoutedPages/GoogleLogin';

export default function middleApp({ Component, pageProps }) {
	const { user, isUserContextSet } = useContext(UserContext);
	const { isRegister, setIsRegister } = useState(false);

	return (
		isUserContextSet === true
			? user.token === null
				? isRegister === true
					? ''
					: <div>
							<Login />
							{/* <GoogleLogin /> */}
						</div> 
				: <Component { ...pageProps } />
			: <div className="text-center">
					<Spinner animation="border" variant="primary" />
				</div> 
	)
}