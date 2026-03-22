import Router from 'next/router'
import Swal from 'sweetalert2';

async function baseFetch(route, options) {
	console.log(route)
	const response = await fetch(route, options);
	const data = await response.json();
	if (data.result === 'invalid-token') {
		await Swal.fire({
			icon: 'error',
			text: 'You might be using an old ' +
				'version or are logged in somewhere else'
		})
		Router.push('/logout');
		Router.push('/receipts/new');
		return {result: false};
	}
	return data;
}

async function fetchWithTimeout(route, options) {
	const { timeout = 5000 } = options;
	const controller = new AbortController();

	const timeoutId = setTimeout(() => controller.abort(), timeout);

	const response = await baseFetch(route, {
		...options,
		signal: controller.signal
	});

	clearTimeout(timeoutId);

	return response;
}

export default {
	baseFetch,
	fetchWithTimeout
}