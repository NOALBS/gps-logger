// This was coded by 715209, but modified by b3ck;
// I left a lot of random stuff in here so you can see what I messed with, APIs I used, etc..
// Maybe it will give you ideas. ¯\_(ツ)_/¯

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const config = require("./config.js");
const fetch = require("node-fetch");
const geoTz = require("geo-tz");

// Don't touch this!
let waitForTheStuff = false; //really you don't want to touch this, like ever, if you do.. nothing will work... seriously.

// This area gives the data a nice little home to stay in, if you add anything in the below functions make sure it ends up here.
let lastRequest = {
  city: "",
  city2: "",
  town: "",
  town2: "",
  //Added street - Peaced_old
  street: "",
  state: "",
  zipcode: "",
  country: "",
  country2: "",
  temp: "",
  time: "",
  direction: "",
  gapi: "",
};

/////////////////
// Timestamp Stuff //
////////////////////////////////////////////////////////////////
function formatAMPM(date) {
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);
  var year = date.getFullYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  var strTime =
    month +
    "/" +
    day +
    "/" +
    year +
    " - " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds +
    " " +
    ampm;
  return strTime;
}
////////////////////////////////////////////////////////////////

// Map Style Stuff
mapstyle = config.MAPSTYLE + ".json";

// Google Map API Stuff
lastRequest.gapi = config.GOOGLEAPI;

// Unqiue Code Stuff
app.use(function checkKey(req, res, next) {
  const timestamp = formatAMPM(new Date());
  const ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
  // console.log(timestamp, ip);
  if (
    ip == "::ffff:127.0.0.1" ||
    ip == "127.0.0.1" ||
    ip == "localhost" ||
    ip == "::1"
  ) {
    console.log(timestamp, ip, "- Access Granted");
    next();
  } else {
    if (req.query.key != config.UNIQUE_CODE) {
      console.log(timestamp, ip, "- Access Denied");
      res.sendStatus(401);
    } else {
      console.log(timestamp, ip, "- Access Granted");
      next();
    }
  }
});

// Log output page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// The stuff output page
app.get("/thestuff", (req, res) => {
  res.sendFile(__dirname + "/the_stuff.html");
});

//Added to add my own stuff - Peaced_old
// The stuff2 output page
app.get("/thestuff2", (req, res) => {
  res.sendFile(__dirname + "/the_stuff2.html");
});

// The Google Maps output page
app.get("/map", (req, res) => {
  res.sendFile(__dirname + "/map.html");
});

// The Google Maps output page
app.get("/map_rotate", (req, res) => {
  res.sendFile(__dirname + "/map_rotate.html");
});

// The way to get map style
app.get("/style", (req, res) => {
  res.sendFile(__dirname + "/map_styles/" + mapstyle);
});

// The way to get default map style
app.get("/default", (req, res) => {
  res.sendFile(__dirname + "/map_styles/default.json");
});

app.get("/mod_map", (req, res) => {
  res.sendFile(__dirname + "/mod_map.html");
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

// My Custom URL in GPS-Logger looks like this: http://<YOUR-IP-or-DNS>:3000/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT&key=<UNIQUE_CODE>
app.get("/log", (req, res) => {
  delete req.query.key;
  
  //IMPERIAL STUFF
  //Current Altitude (FT) - a=%ALT
	//if (req.query.a) {
	//	req.query.a = `${Math.round(req.query.a / 0.3048)} FT`;
	//}

	// Current Speed (MPH) - s=%SPD
	//if (req.query.s) {
	//	req.query.s = `${Math.floor(req.query.s * 2.23694)} MPH`;
	//}

  //METRIC STUFF
  //Current Altitude (FT) - a=%ALT
  if (req.query.a) {
    req.query.a = `${Math.round(req.query.a)} M`;
  }

  // Current Speed (km/h) - s=%SPD
  if (req.query.s) {
    req.query.s = `${Math.floor(req.query.s)} km/h`;
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

    lastRequest.time = new Date().toLocaleTimeString("en-US", {
      timeZone: geoTz(lat, lon)[0],
      hour: "2-digit",
      minute: "2-digit",
    });

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
  getHEREdotcom(lat, lon, config.HERE_appid, config.HERE_apikey);
};

const degToCompass = (num) => {
  let val = Math.floor(num / 22.5 + 0.5);
  let arr = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return arr[val % 16];
};

// OpenWeatherMap needs an API, please set this in the 'config.js' file.
const getOpenWeatherMap = async (lat, lon, units, apikey) => {
  try {
    let data = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apikey}`
    );
    let openweathermap = await data.json();

    icon = openweathermap.weather[0].icon;

    lastRequest.icon = `http://openweathermap.org/img/wn/${icon}@2x.png`;

    lastRequest.direction = degToCompass(openweathermap.wind.deg);
    lastRequest.temp = Math.floor(openweathermap.main.temp);
  } catch (error) {
    console.log("getOpenWeatherMap request failed or something.", error);
  }
};

// HERE.com ( https://developer.here.com/sign-up?create=Freemium-Basic&keepState=true&step=account )
const getHEREdotcom = async (lat, lon, appid, apikey) => {
  try {
    let data = await fetch(
      `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat}%2C${lon}&lang=en-US&app_id=${appid}&apikey=${apikey}`
    );

    let heredotcom = await data.json();

    here_title = heredotcom.items[0].title;
    here_town = heredotcom.items[0].address.city;
    here_city = heredotcom.items[0].address.city;
    here_country = heredotcom.items[0].address.countryCode;

    // I wanted to customize certain city names, so this is how I did it.
    if (here_town == "Coon Rapids") {
      lastRequest.town2 = "( Raccoon City ) - ";
    } else if (here_town == "Fridley") {
      lastRequest.town2 = "( Friendly Fridley ) - ";
    } else if (
      here_town == null ||
      here_town == "undefined" ||
      here_town == here_city
    ) {
      lastRequest.town2 = "";
    } else {
      lastRequest.town2 = `( ${here_town} ) - `;
    }

    // Result [0]
    lastRequest.town = here_town;

    lastRequest.zipcode = heredotcom.items[0].address.postalCode;

    // Result [1]

    lastRequest.city = here_city;

    if (here_city == null || here_town == "undefined") {
      lastRequest.city2 = "";
    } else {
      lastRequest.city2 = `${here_city}, `;
    }

    lastRequest.state = heredotcom.items[0].address.stateCode;
    lastRequest.title = heredotcom.items[0].title;
    lastRequest.street = heredotcom.items[0].address.street;
    lastRequest.country = heredotcom.items[0].address.country;
    lastRequest.country2 = ` - ${here_country}`;
  } catch (error) {
    console.log("getHEREdotcom request failed or something.", error);
  }
};

//don't touch this either =p
http.listen(config.PORT, () => {
  console.log(`listening on *:${config.PORT}`);
});
