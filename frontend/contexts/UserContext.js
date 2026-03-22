import React, { useState, useEffect } from 'react';
import UserHelper from '../helper/userHelper';

const UserContext = React.createContext();

export default UserContext;

export function UserProviderWrapper({ children }) {
	const [user, setUser] = useState({
		token: null,
		isAdmin: false
	});

	const [isUserContextSet, setIsUserContextSet] = useState(false);

	const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API || '';

	useEffect(() => {
		async function setToken() {
			const token = localStorage.getItem('token');
			if (token === null) {
				setIsUserContextSet(true);
				return
			};
			const userDetails = await UserHelper.getUserDetails(token);

			if (userDetails !== false) {
				setUser({ token, isAdmin:  userDetails.isAdmin });
			} else {
				localStorage.removeItem('token');
			}
			setIsUserContextSet(true);
		}

		setToken();
	}, []);

	const unsetUser = () => {
		localStorage.clear();
		setUser({
			token: null,
			isAdmin: false
		});
	}

	return (
		<UserContext.Provider value={{user, setUser, unsetUser, isUserContextSet}}>
			{ children }
		</UserContext.Provider>
	)
}
