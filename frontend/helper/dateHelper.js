function dateObjToControl(dateObj) {
	const year = dateObj.getFullYear();
	const month = addPrecedingZero(dateObj.getMonth() + 1); // month in Date month is 0 index
	const date = addPrecedingZero(dateObj.getDate());

	if (Number.isNaN(year)) return '';

	return `${year}-${month}-${date}`
}

function addPrecedingZero(num) {
	return (num.toString().length >= 2) ? num.toString() : `0${num}`
}

function dateControlToUNIX(dateControl) {
	const [year, month, date] = dateControl.split('-');
	console.log(new Date(Number(year), Number(month - 1), Number(date)).getTime());
	// month is -1 because Date month is 0 index

	return new Date(Number(year), Number(month - 1), Number(date)).getTime();
}

function dateControlToEODUNIX(dateControl) {
	const [year, month, date] = dateControl.split('-');
	return new Date(Number(year), Number(month -1), Number(date), 23, 59, 59, 999).getTime();
}

export default {
	dateObjToControl,
	addPrecedingZero,
	dateControlToUNIX,
	dateControlToEODUNIX
}