// This was coded by 715209, but modified by b3ck;
// I left a lot of random stuff in here so you can see what I messed with, APIs I used, etc..
// Maybe it will give you ideas. ¯\_(ツ)_/¯

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const config = require("./config.js");
const fetch = require("node-fetch");

// Don't touch this!
let waitForTheStuff = false; //really you don't want to touch this, like ever, if you do.. nothing will work... seriously.


// This area gives the data a nice little home to stay in, if you add anything in the below functions make sure it ends up here.
let lastRequest = {
	city: "",
	town: "",
	state: "",
	zipcode: "",
	country: "",
	temp: "",
	time: ""
};

// Log output page
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

// The stuff output page
app.get("/thestuff", (req, res) => {
	res.sendFile(__dirname + "/the_stuff.html");
});

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// Endpoint(s) to grab data for use with nightbot twitch chatbot, or anything really..
//
// Below is an example command I use for nightbot to pull weather from my current location;
// $(eval var q = "$(query)";if (q === "") {("$(weather $(urlfetch http://<YOUR-IP-or-DNS>:3000/stats/citystate))");} else {("$(weather $(query))");})
// 
// You could also use this to create on-demand commands to get your location like this example below:
// @$(user), b3ck is currently in: $(eval '$(urlfetch http://<YOUR-IP-or-DNS>:3000/stats/citystate)'.replace(/\"/g,"");)
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
app.get("/stats/citystate", async (req, res) => {
	res.send(`${lastRequest.city}, ${lastRequest.state}`);
});

// Here will give you an endpoint for anything, such as; http://<YOUR-IP-or-DNS>:3000/stats/a (altitude) or /b (battery level) or /s (speed)
// Basically any parameter you pass over in the GPS-Logger app.
app.get("/stats/:anything", (req, res) => {
	res.send(`${lastRequest[req.params.anything]}`);
});


// My Custom URL in GPS-Logger looks like this: http://<YOUR-IP-or-DNS>:3000/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT
app.get("/log", (req, res) => {

	//Current Altitude (FT) - a=%ALT
	if (req.query.a) {
		req.query.a = `${Math.round(req.query.a / 0.3048)} FT`;
	}

	// Current Speed (MPH) - s=%SPD
	if (req.query.s) {
		req.query.s = `${Math.floor(req.query.s * 2.23694)} MPH`;
	}

	// Current Battery Level (Phone Estimated) - b=%BATT
	if (req.query.b) {
		req.query.b = `${Math.round(req.query.b)}`;
	}

	for (let [key, value] of Object.entries(req.query)) {
		lastRequest[key] = value;
	}

	//Current Lattitude & Longitude - lat=%LAT / lon=%LON
	if (req.query.lat && req.query.lon) {
		const { lat, lon } = req.query;

		!waitForTheStuff && getTheStuff(lat, lon);
		io.emit("THESTUFF", lastRequest);

		delete req.query.lat;
		delete req.query.lon;
	}

	io.emit("data", req.query);
	res.sendStatus(200);
});

const getTheStuff = (lat, lon) => {
	if (!waitForTheStuff) {
		waitForTheStuff = true;

		setTimeout(() => {
			waitForTheStuff = false;
		}, config.RATELIMIT); // you can change the API rate limit in the 'config.js' file.
	}

	getOpenWeatherMap(lat, lon, config.UNITS, config.OWM_Key);
	getHEREdotcom(lat, lon, config.HERE_appid, config.HERE_appcode);
	getWeatherGov(lat, lon);
}

// OpenWeatherMap needs an API, please set this in the 'config.js' file.
const getOpenWeatherMap = async (lat, lon, units, apikey) => {
	try {
		let data = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apikey}`);
		let openweathermap = await data.json();

		lastRequest.temp = Math.floor(openweathermap.main.temp)
	} catch (error) {
		console.log("getOpenWeatherMap request failed or something.", error);
	}

}

// Weather.gov needs no API Key. POGGERS
const getWeatherGov = async (lat, lon) => {
	try {
		let data = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
		let weathergov = await data.json();
		
		// This will grab the current time in 12 hour format based on your LON & LAT.
		lastRequest.time = new Date().toLocaleTimeString("en-US", { timeZone: weathergov.properties.timeZone, hour: '2-digit', minute: '2-digit' });

	} catch (error) {
		console.log("getWeatherGov request failed or something.", error);
	}
}

// HERE.com ( https://developer.here.com/sign-up?create=Freemium-Basic&keepState=true&step=account )
const getHEREdotcom = async (lat, lon, appid, appcode) => {
	try {
		let data = await fetch(`https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?prox=${lat}%2C${lon}%2C250&mode=retrieveAll&maxresults=2&app_id=${appid}&app_code=${appcode}`);
		let heredotcom = await data.json();

		// Result [0]
		lastRequest.town = heredotcom.Response.View[0].Result[0].Location.Address.City
		lastRequest.zipcode = heredotcom.Response.View[0].Result[0].Location.Address.PostalCode

		// Result [1]
		lastRequest.city = heredotcom.Response.View[0].Result[1].Location.Address.City
		lastRequest.state = heredotcom.Response.View[0].Result[1].Location.Address.State
		lastRequest.country = heredotcom.Response.View[0].Result[1].Location.Address.Country

	} catch (error) {
		console.log("getHEREdotcom request failed or something.", error);
	}
}

//don't touch this either =p
http.listen(config.PORT, () => {
	console.log(`listening on *:${config.PORT}`);
});
