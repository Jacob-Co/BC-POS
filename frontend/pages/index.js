import { Fragment, useContext, useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import NewReceiptScanner from './receipts/new';

export default function Home() {
	return (
		<Fragment>
			<NewReceiptScanner />
		</Fragment>
	)
}
