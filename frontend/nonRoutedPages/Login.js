import { Fragment, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router'
import { Form, Button } from 'react-bootstrap';
import UserContext from '../contexts/UserContext';
import UserHelper from '../helper/userHelper';
import Swal from 'sweetalert2';

export default function index() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isActive, setIsActive] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const router = useRouter();

	useEffect(() => {
		const isProperemail = !!email.match(/.+@.+/);
		const isProperPassword = password.length >= 4;
		if (isProperemail && isProperPassword) {
			setIsActive(true);
		} else {
			setIsActive(false);
		}
	}, [email, password])

	const { setUser } = useContext(UserContext);

	async function onLogin(e) {
		e.preventDefault();
		setIsLoading(true);

		const backendAPI = process.env.NEXT_PUBLIC_BACKEND_API || '';

		// get token
		const loginRes = await UserHelper.login({email, password});

		// handle invalid credentials

		if (loginRes === false) {
			setPassword('');
			setIsLoading(false);
			return Swal.fire('Something Went Wrong.', 'Please try again.', 'error');
		}

		const token = loginRes;

		//get user details
		const userDetails = await UserHelper.getUserDetails(token);
		// save to local storage
		localStorage.setItem('token', token);

		// save to user context
		setUser({
			token,
			isAdmin: userDetails.isAdmin
		});

		Swal.fire('Successful Sign in!', 'Let\'s get scanning!', 'success');
		// go to home page
		router.push('/');
	}

	return (
		<Form onSubmit={onLogin}>
			<Form.Group>
				<Form.Label>
					Email
				</Form.Label>
				<Form.Control 
					type="input"
					placeholder="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>
			</Form.Group>
			<Form.Group>
				<Form.Label>
					Password
				</Form.Label>
				<Form.Control 
					type="password"
					placeholder="xxxxxx"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</Form.Group>
			<Button 
				className="d-block w-100 text-center"
				variant={isActive ? 'primary' : 'secondary'}
				disabled={ !isActive }
				type="submit"
			>
				{ isLoading
					? <Fragment>
							<span 
							className="spinner-border spinner-border-sm" 
							role="status" 
							aria-hidden="true">
							</span>
  							{` Logging in...`}
  						</Fragment> 
					: 'Login'
				}
			</Button>
		</Form>
	)
}