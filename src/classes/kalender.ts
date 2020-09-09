/*
export function generateDate(date){
	let dateObj = new Date(date);

	let month = (dateObj.getMonth()+1);
	if(month < 10){
		month = "0"+ month;
	}
	let day = (dateObj.getDate() + 1);
	if(day < 10){
		day = "0"+ day;
	}
	let hour = (dateObj.getUTCHours() -1);
	if(hour < 10){
		hour = "0"+ hour;
	}
	let minute = (dateObj.getMinutes());
	if(minute < 10){
		minute = "0"+ minute;
	}
	let seconds = (dateObj.getSeconds());
	if(seconds < 10){
		seconds = "0"+ seconds;
	}
	return dateObj.getFullYear() + "" + month + "" + day + "T" + hour + minute + seconds + "Z";
}

export function generateICS(data){
	return new Promise(async function (resolve, reject) {

		let output = "";

		const begin = "BEGIN:VCALENDAR\n" +
			"VERSION:2.0\n" +
			"CALSCALE:GREGORIAN\n";
		output = begin;


		for (let i = 0; i < data.length; i++) {
			let event = "BEGIN:VEVENT\n" +
				"DTEND:" + generateDate(data[i].end) + "\n" +
				"DTSTAMP:" + generateDate(data[i].begin) + "\n" +
				"DTSTART:" + generateDate(data[i].begin) + "\n" +
				"SUMMARY:" + data[i].summary + "\n" +
				"DESCRIPTION: " + data[i].description + "\n" +
				"END:VEVENT\n";
			output = output + event;
		}
		const end = "BEGIN:VTIMEZONE\n" +
			"TZID:Europe/Berlin\n" +
			"BEGIN:DAYLIGHT\n" +
			"DTSTART:19810329T020000\n" +
			"RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\n" +
			"TZNAME:CEST\n" +
			"TZOFFSETFROM:+0100\n" +
			"TZOFFSETTO:+0200\n" +
			"END:DAYLIGHT\n" +
			"BEGIN:STANDARD\n" +
			"DTSTART:19961027T030000\n" +
			"RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\n" +
			"TZNAME:CET\n" +
			"TZOFFSETFROM:+0200\n" +
			"TZOFFSETTO:+0100\n" +
			"END:STANDARD\n" +
			"END:VTIMEZONE\n" +
			"END:VCALENDAR\n";
		output = output + end;
		resolve(output);
	})
}
 */
