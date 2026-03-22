# Power Barcode Scanner

A web POS System with a camera barcode scanner.
- Barcode Recognition using smart phone camera 
- Automated Generation of Receipts
- Inventory tracking
- CSV File Generation for Inventory

# Video Examples
1. [Adding a new Item](https://www.youtube.com/watch?v=AIcqnjnCB0c&list=PLhQ0s_dzBuSFRvD5VocWivV9D_LLenSxb&index=1&ab_channel=JacobCo)
2. [Adding an item using a barcode scanner](https://www.youtube.com/watch?v=LtiTT7K4eYk&list=PLhQ0s_dzBuSFRvD5VocWivV9D_LLenSxb&index=2&ab_channel=JacobCo)
3. [Creating and sending a receipt](https://www.youtube.com/watch?v=LUtMMJO_HPo&list=PLhQ0s_dzBuSFRvD5VocWivV9D_LLenSxb&index=3&ab_channel=JacobCo)
4. [Creating receipt using a barcode scanner](https://www.youtube.com/watch?v=549qemxSngo&list=PLhQ0s_dzBuSFRvD5VocWivV9D_LLenSxb&index=6&ab_channel=JacobCo)
5. [Offline sending of receipts](https://www.youtube.com/watch?v=_h8gHeFe0xs&list=PLhQ0s_dzBuSFRvD5VocWivV9D_LLenSxb&index=5&ab_channel=JacobCo)

# Installation

1. Requires node version 16
1. Install npm packages inside the backend folder and frontend folder
	```
	cd frontend && npm install && cd ../backend && npm install
	```
2. Fill out environment variables .env for backend and .env.local frontend
	```
	// .env file
	MONGO_CONNECTION_STRING // connection to mongo atlas
	SECRET // Used when creating a user token
	FRONTEND_API // frontend PORT
	
	// .env.local
	NEXT_PUBLIC_BACKEND_API // your backend PORT
	```
3. Run app locally
	```
	// both for frontend and backend
	npm run dev
	```
# Tools Used & Rationale
Frontend
- 
The barcode scanner is powered by the npm package: [__@ericblade/quagga2__](https://www.npmjs.com/package/@ericblade/quagga2), chosen because it offers real-time recognition of barcodes using from a video stream. 

__Next JS__ was used as the frontend framework as it is based on React, which makes building frontend components organized and clean. Additionally, Next JS provides easy routing and is easy to set up on Vercel where the app is currently running on. The site is also statically generated (default of Next JS) leading to faster load times.

__Bootstrap__ and __react-bootstrap__ were employed to make it fast and easy to construct UI components that were both responsive and functional.

Backend
- 
__Express JS__ was used as time was a constraint, and it is easy and simple to set up.

To double check for the validity of the barcode, I used [__Puppeteer__](https://www.npmjs.com/package/puppeteer), a library that creates a headless browser. I used this library to automate searching google and see if the barcode brings back any results as invalid barcodes return 0 results.

Chose a __Pure REST API__ architecture as the app uses HTTP to communicate with each other. Additionally stateless nature of the application decreases the load on the server, which is important when working on an hours restriction for free use of the server. The drawback of the architecture style on network efficiency is mitigated by the fact that at most only 5 users will be accessing the web application.

For the database, __MongoDB__ was used as it offers a free cloud database service with 500 mb of space, which is generous in comparison to other cloud databases. Mongoose was used as an ODM  for MongoDB, this made data validation and consistency possible when transacting with the database.


# Mongoose Model

![Mongoose Model](https://yuml.me/jacobco/barcode-scanner.jpg)
