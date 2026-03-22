import { Fragment, useContext } from 'react';
import { Container } from 'react-bootstrap';

import '../styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';

import ContainerContexts from '../contexts/ContainerContexts';
import NavBar from '../components/NavBar';
import MiddleApp from '../components/MiddleApp';

function MyApp({ Component, pageProps }) {
	return (
		<Fragment>
			<ContainerContexts>
				<NavBar />
				<Container style={
					{maxWidth: '800px'}}>
					<MiddleApp Component={Component} pageProps={pageProps}/>
				</Container>
		  	</ContainerContexts>
		</Fragment>
	)
}

export default MyApp
