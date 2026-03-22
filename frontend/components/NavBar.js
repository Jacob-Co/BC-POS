import { Fragment, useContext, useState } from 'react';
import Link from 'next/link';
import { Navbar, Nav } from 'react-bootstrap';
import UserContext from '../contexts/UserContext';
import ReceiptContext from '../contexts/ReceiptContext';

export default function NavBar() {
	const { user } = useContext(UserContext);
	const { unsentUNIX } = useContext(ReceiptContext);
	const [expanded, setExpanded] = useState(false);
	return (
		<Navbar expanded={expanded} bg="dark" variant="dark" expand="lg">
			<Link href="/">
				<a className="navbar-brand "> Power Barcode Scanner <sub>v4.1.2</sub></a>
			</Link>
			{ (user.token)
				? <Fragment>
						<Navbar.Toggle 
							aria-controls="basic-navbar-nav" 
							onClick={() => setExpanded(!expanded)} 
						/>
						<Navbar.Collapse id="basic-navbar-nav" className="text-white">
							<Nav onClick={() => setExpanded(false)}>
								<Link href="/receipts/new">
									<a role="button" className="nav-link">
										Receipt Scanner
									</a>
								</Link>

								<Link href="/items/new">
									<a role="button" className="nav-link">
										New Item Scanner
									</a>
								</Link>

								<Link href="/items">
									<a role="button" className="nav-link">
										Items
									</a>
								</Link>

								<Link href="/receipts/history">
									<a role="button" className="nav-link">
										Receipt History
									</a>
								</Link>

								<Link href="/receipts/sales">
									<a role="button" className="nav-link">
										Day Sales
									</a>
								</Link>

								{ unsentUNIX.length > 0
									? <Link href="/receipts/unsent">
											<a role="button" className="nav-link">
												{'Send Unsent Receipts: '} 
												<span className="badge badge-light">
													{unsentUNIX.length}
												</span>
											</a>
										</Link>
									: ''
								}

								<Link href="/items/invalid">
									<a role="button" className="nav-link">
										Invalid Barcodes
									</a>
								</Link>

								<Link href="/logout">
									<a role="button" className="nav-link">
										Logout
									</a>
								</Link>
							</Nav>
						</Navbar.Collapse>
					</Fragment>
				
				: ''
			}
			
		</Navbar>
	)
}