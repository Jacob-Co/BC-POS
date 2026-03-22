import { Fragment, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

import UserContext from '../contexts/UserContext';

// unset user, clear localstorage, redirect

export default function index() {
	const { unsetUser } = useContext(UserContext);
	const router = useRouter();

	useEffect(() => {
		unsetUser();
		localStorage.clear();
		alert('Successfully Logged Out');
		router.push('/');
	}, [])

	return(
		<Fragment></Fragment>
	);
}