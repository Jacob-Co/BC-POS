import React, { Fragment, useEffect, useState, useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import Quagga from '@ericblade/quagga2';
import styled from 'styled-components';
import Swal from 'sweetalert2';

// const StyledCircle = styled.button`
// 	height: 80px;
// 	width: 80px;
// 	border-radius: 50%;
// `

const RelativeDiv = styled.div`
	position: relative;
`

const VideoDiv = styled.div`
	position: absolute;
    right: 0;
    top: 0;
    left: 0;
    border: 1px solid red;
  	overflow: hidden;
`

export default function ScannerWrapper({ scanFunction, currentReader, setCurrentReader, requireReaderButtons = true }) {
	const [ isScannerOn, setIsScannerOn ] = useState(false);
	const [ reader, setReader ] = useState(currentReader || 'upc_reader');
	const [patchSize, setPatchSize] = useState('small');
	const [resolution, setResolution] = useState(localStorage.getItem('resolution') || '1080');
	const [scannerHeight, setScannerHeight] = useState();
	const [scannerWidth, setScannerWidth] = useState();
	const scannerDivRef = useRef();

	useEffect(() => {
		if (resolution === '1080') {
			setScannerHeight(1080);
			setScannerWidth(1920);
			setPatchSize('small');
		} else if (resolution === '720') {
			setScannerHeight(720);
			setScannerWidth(1280);
			setPatchSize('medium');
		} else if (resolution === '480') {
			setScannerHeight(480);
			setScannerWidth(640);
			setPatchSize('large');
		}
	}, [resolution])

	return (
		<Fragment>
			<Button 
				variant={isScannerOn ? 'success' : 'danger'}
				onClick={() => {
					setIsScannerOn(!isScannerOn)
				}}
			>
				Scanner {isScannerOn ? 'On' : 'Off'}
			</Button>
			<div ref={scannerDivRef}>
				{ isScannerOn
					? <Fragment>
							{requireReaderButtons
								? <div>
										<InfoButton />
										<EANButton
											reader={reader}
											setReader={(newReader) => {
												if (setCurrentReader !== undefined) setCurrentReader(newReader);
												setReader(newReader);
											}}
										/>
										<UPCButton 
											reader={reader}
											setReader={(newReader) => {
												if (setCurrentReader !== undefined) setCurrentReader(newReader);
												setReader(newReader);
											}}
										/>
									</div>
								: ''
							}
							<Form>
								<Form.Group>
								    <Form.Label>Resolution</Form.Label>
								    <Form.Control 
								    	as="select"
								    	onChange={(e) => {
								    		localStorage.setItem('resolution', e.target.value);
								    		setResolution(e.target.value);
								    	}}
								    	value={resolution}
								    >
								    	<option value="1080">1080 (High Resolution)</option>
								    	<option value="720">720 (Average Resolution)</option>
								    	<option value="480">480 (Low Resolution)</option>
								    </Form.Control>
								</Form.Group>
							</Form>
							<Scanner 
								reader={reader}
								onSuccessScan={scanFunction}
								patchSize={patchSize}
								scannerHeight={scannerHeight}
								scannerWidth={scannerWidth}
							/>
						</Fragment>
					: ''
				}
			</div>
		</Fragment>
	)
}

function InfoButton() {
	function showInfo() {
		Swal.fire({
			title: 'EAN VS UPC',
			text: 'UPC has a digit on the right, after the barcode. EAN does not.',
			imageUrl: 'https://dh7pjb6qw07ip.cloudfront.net/uploads/upc-vs-ean.jpg',
			imageAlt: 'EAN VS UPC'
		})
	}

	return (
		<Button variant="light" onClick={showInfo}>
			&#8505;
		</Button>
	)
}

function EANButton({ reader, setReader }) {
	return (
		<Fragment>
			<Button
				onClick={() => setReader('ean_reader')}
				variant={reader === 'ean_reader' ? 'success' : 'secondary'}
			>
				EAN Reader
			</Button>
		</Fragment>
	)
}

function UPCButton({ reader, setReader }) {
	return (
		<Fragment>
			<Button
				onClick={() => setReader('upc_reader')}
				variant={reader === 'upc_reader' ? 'success' : 'secondary'}
			>
				UPC Reader
			</Button>
		</Fragment>
	)
}

function getMedian(arr) {
	arr.sort((a, b) => a - b);
	const half = Math.floor(arr.length / 2);
	if (half % 2 === 1) {
		return arr[half]
	}

	return (arr[half - 1] + arr[half]) / 2;
}

function getMedianOfCodeErrors(decodedCodes) {
	const errors = decodedCodes.filter(x => x.error !== undefined)
		.map(y => y.error);
	const median = getMedian(errors);
	return { 
		probablyValid: !(median > 0.4 || errors.some(e => e >= 0.4)),
		median
	}
}

function Scanner({ reader, onSuccessScan, patchSize, scannerHeight, scannerWidth }) {
	const [ barcode, setBarcode ] = useState(null);

	useEffect(() => {
		const interactiveDiv = document.querySelector('#interactive');
		interactive.style.height = interactive.offsetWidth / 16 * 9 + 'px';
	}, []);
	/* props: 
		1. reader (string) either 'ean_reader' or 'upc_reader'
		2. onSucces, onFailure
	*/

	function initializeQuagga() {
		Quagga.init(
			{
            inputStream: {
                type : "LiveStream",
                constraints: {
                    width: scannerWidth, 
                    height: scannerHeight,
                    facingMode: "environment",
                    aspectRatio: {min: 1, max: 2}
                }
            },
            locator: {
                patchSize: patchSize,
                halfSample: true
            },
            numOfWorkers: 0,
            frequency: 10,
            decoder: {
                readers : [{
                    format: reader,
                    config: {}
                }]
            },
            locate: true
        },
			function(err) {
				if (err) {
					console.log(err);
					return
				}
				Quagga.start();
			}
		)
	}

	function stopQuagga() {
		Quagga.offProcessed();
		Quagga.offDetected();
		Quagga.stop();
	}

	function startDetecting() {
		Quagga.onDetected(async (result) => {
			const validityObject = 
				getMedianOfCodeErrors(result.codeResult.decodedCodes);
			if (validityObject.probablyValid) {
				setBarcode(result.codeResult.code);
				// await onSuccessScan(result.codeResult.code);
				// initializeQuagga();
				// startDetecting();
			}
		});
	}



	useEffect(() => {
		/*
			Important config notes for Quagga init
			1. decoder: { readers: [$1]} // $1 should only be one value
			2. numOfWorkers: 0 // should always be set to 0
			3. locator: {halfSample: true, patchSize: $1}
				// halfves the size and smooths the pic out for easier recog
					// should only be false if the barcode is far away or too 
						small 
				// $1 depends on how big the barcode relative to the camera
					screen, laptops are medium while on phone should be large
		*/
		if (barcode === null) {
			initializeQuagga()
			startDetecting()
			return stopQuagga;
		} else {
			(async function() {
				await onSuccessScan(barcode);
				setBarcode(null);
			})();
		}
	}, [barcode, reader, patchSize, scannerHeight, scannerWidth])

	return (
		<Fragment>
			<RelativeDiv>
				<VideoDiv id="interactive" className="viewport"></VideoDiv>
			</RelativeDiv>
		</Fragment>
	)
}