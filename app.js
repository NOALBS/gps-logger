// This was coded by 715209, but modified by b3ck;
// I left a lot of random stuff in here so you can see what I messed with, APIs I used, etc..
// Maybe it will give you ideas. ¯\_(ツ)_/¯
// Major updates to work with HERE.com by Peaced_Old, also with more random tweaks, see notes in code.
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const config = require("./config.js");
const fetch = require("node-fetch");
const geoTz = require('geo-tz');

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
    gapi: ""
};

/////////////////////
// Timestamp Stuff //
/////////////////////
function formatAMPM(date) {
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var strTime = month + '/' + day + '/' + year + ' - ' + hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
}
/////////////////////

// Map Style Stuff
mapstyle = config.MAPSTYLE + '.json';

// Google Map API Stuff
lastRequest.gapi = config.GOOGLEAPI

// Unqiue Code Stuff
app.use(function checkKey(req, res, next) {

    const timestamp = formatAMPM(new Date);
    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    // console.log(timestamp, ip);
    if (ip == "::ffff:127.0.0.1" || ip == "127.0.0.1" || ip == "localhost" || ip == "::1") {
        console.log(timestamp, ip, "- Access Granted")
        next();
    } else {
        if (req.query.key != config.UNIQUE_CODE) {
            console.log(timestamp, ip, "- Access Denied")
            res.sendStatus(401);
        } else {
            console.log(timestamp, ip, "- Access Granted")
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
    if (req.query.a) {
    	req.query.a = `${Math.round(req.query.a / 0.3048)} FT`;
    }

    // Current Speed (MPH) - s=%SPD
    if (req.query.s) {
    	req.query.s = `${Math.floor(req.query.s * 2.23694)} MPH`;
    }

    //METRIC STUFF
    //Current Altitude (FT) - a=%ALT
    //if (req.query.a) {
    //    req.query.a = `${Math.round(req.query.a)} M`;
    //}

    // Current Speed (km/h) - s=%SPD
    //if (req.query.s) {
    //    req.query.s = `${Math.floor(req.query.s)} km/h`;
    //}

    // Current Battery Level (Phone Estimated) - b=%BATT
    if (req.query.b) {
        req.query.b = `${Math.round(req.query.b)}`;
    }

    for (let [key, value] of Object.entries(req.query)) {
        lastRequest[key] = value;
    }

    //Current Lattitude & Longitude - lat=%LAT / lon=%LON
    if (req.query.lat && req.query.lon) {
        const {
            lat,
            lon
        } = req.query;

        lastRequest.time = new Date().toLocaleTimeString("en-US", {
            timeZone: geoTz(lat, lon)[0],
            hour: '2-digit',
            minute: '2-digit'
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
    getHEREdotcom(lat, lon, config.HERE_appid, config.HERE_appcode);
}

const degToCompass = (num) => {
    let val = Math.floor((num / 22.5) + 0.5);
    let arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}

// OpenWeatherMap needs an API, please set this in the 'config.js' file.
const getOpenWeatherMap = async (lat, lon, units, apikey) => {
    try {
        let data = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apikey}`);
        let openweathermap = await data.json();

        icon = openweathermap.weather[0].icon

        lastRequest.icon = `http://openweathermap.org/img/wn/${icon}@2x.png`

        lastRequest.direction = degToCompass(openweathermap.wind.deg)
        lastRequest.temp = Math.floor(openweathermap.main.temp)
    } catch (error) {
        console.log("getOpenWeatherMap request failed or something.", error);
    }

}

// HERE.com ( https://developer.here.com/sign-up?create=Freemium-Basic&keepState=true&step=account )
const getHEREdotcom = async (lat, lon, appid, appcode) => {
    try {
        let data = await fetch(`https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat}%2C${lon}&lang=en-US&app_id=${appid}&apikey=${appcode}`);
        let heredotcom = await data.json();

        const title = heredotcom.items[0].title;

        // Updated part
        const titleParts = title.split(',');
        const lastPart = titleParts[titleParts.length - 1].trim();
        const country = lastPart;
        const countryCodeMapping = {
            "Netherlands": "NL",
            "United States": "US",
            "United Kingdom": "GB",
            "Canada": "CA",
            "Germany": "DE",
            "France": "FR",
            "Italy": "IT",
            "Spain": "ES",
            "Japan": "JP",
            "China": "CN",
            "India": "IN",
            "Brazil": "BR",
            "Russia": "RU",
            "Australia": "AU",
            "South Korea": "KR",
            "Mexico": "MX",
            "South Africa": "ZA",
            "Nigeria": "NG",
            "Argentina": "AR",
            "Turkey": "TR",
            "Saudi Arabia": "SA",
            "Sweden": "SE",
            "Norway": "NO",
            "Finland": "FI",
            "Croatia": "HR",
            "Austria": "AT",
            "Belgium": "BE",
            "Greece": "GR",
            "Switzerland": "CH",
            "Portugal": "PT",
            "Denmark": "DK",
            "Ireland": "IE",
            "Poland": "PL",
            "Hungary": "HU",
            "Czech Republic": "CZ",
            "Romania": "RO",
            "Bulgaria": "BG",
            "Netherlands Antilles": "AN",
            "New Zealand": "NZ",
            "Norfolk Island": "NF",
            "Niue": "NU",
            "Nauru": "NR",
            "Vanuatu": "VU",
            "Wallis and Futuna": "WF",
            "Fiji": "FJ",
            "Tuvalu": "TV",
            "Papua New Guinea": "PG",
            "Solomon Islands": "SB",
            "Norfolk Island": "NF",
            "Niue": "NU",
            "Nauru": "NR",
            "Vanuatu": "VU",
            "Wallis and Futuna": "WF",
            "Fiji": "FJ",
            "Tuvalu": "TV",
            "Papua New Guinea": "PG",
            "Solomon Islands": "SB",
            "Tuvalu": "TV",
            "Kiribati": "KI",
            "Palau": "PW",
            "Marshall Islands": "MH",
            "Micronesia": "FM",
            "Samoa": "WS",
            "Tonga": "TO",
            "Cook Islands": "CK",
            "French Polynesia": "PF",
            "New Caledonia": "NC",
            "Antarctica": "AQ",
            "Greenland": "GL",
            "Faroe Islands": "FO",
            "Iceland": "IS",
            "Luxembourg": "LU",
            "Monaco": "MC",
            "San Marino": "SM",
            "Vatican City": "VA",
            "Cyprus": "CY",
            "Estonia": "EE",
            "Latvia": "LV",
            "Lithuania": "LT",
            "Malta": "MT",
            "Slovakia": "SK",
            "Slovenia": "SI",
            "Moldova": "MD",
            "Ukraine": "UA",
            "Belarus": "BY",
            "Albania": "AL",
            "Bosnia and Herzegovina": "BA",
            "North Macedonia": "MK",
            "Montenegro": "ME",
            "Serbia": "RS",
            "Kosovo": "XK",
            "Andorra": "AD",
            "Liechtenstein": "LI",
            "Jersey": "JE",
            "Guernsey": "GG",
            "Isle of Man": "IM",
            "Algeria": "DZ",
            "Angola": "AO",
            "Benin": "BJ",
            "Botswana": "BW",
            "Burkina Faso": "BF",
            "Burundi": "BI",
            "Cape Verde": "CV",
            "Cameroon": "CM",
            "Central African Republic": "CF",
            "Chad": "TD",
            "Comoros": "KM",
            "Congo (Congo-Brazzaville)": "CG",
            "Congo (Congo-Kinshasa)": "CD",
            "Djibouti": "DJ",
            "Egypt": "EG",
            "Equatorial Guinea": "GQ",
            "Eritrea": "ER",
            "Eswatini (fmr. 'Swaziland')": "SZ",
            "Ethiopia": "ET",
            "Gabon": "GA",
            "Gambia": "GM",
            "Ghana": "GH",
            "Guinea": "GN",
            "Guinea-Bissau": "GW",
            "Ivory Coast": "CI",
            "Kenya": "KE",
            "Lesotho": "LS",
            "Liberia": "LR",
            "Libya": "LY",
            "Madagascar": "MG",
            "Malawi": "MW",
            "Mali": "ML",
            "Mauritania": "MR",
            "Mauritius": "MU",
            "Morocco": "MA",
            "Mozambique": "MZ",
            "Namibia": "NA",
            "Niger": "NE",
            "Nigeria": "NG",
            "Rwanda": "RW",
            "Sao Tome and Principe": "ST",
            "Senegal": "SN",
            "Seychelles": "SC",
            "Sierra Leone": "SL",
            "Somalia": "SO",
            "South Sudan": "SS",
            "Sudan": "SD",
            "Tanzania": "TZ",
            "Togo": "TG",
            "Tunisia": "TN",
            "Uganda": "UG",
            "Zambia": "ZM",
            "Zimbabwe": "ZW",
            "Afghanistan": "AF",
            "Armenia": "AM",
            "Azerbaijan": "AZ",
            "Bahrain": "BH",
            "Bangladesh": "BD",
            "Bhutan": "BT",
            "Brunei": "BN",
            "Cambodia": "KH",
            "China": "CN",
            "Cyprus": "CY",
            "Georgia": "GE",
            "India": "IN",
            "Indonesia": "ID",
            "Iran": "IR",
            "Iraq": "IQ",
            "Israel": "IL",
            "Japan": "JP",
            "Jordan": "JO",
            "Kazakhstan": "KZ",
            "Kuwait": "KW",
            "Kyrgyzstan": "KG",
            "Laos": "LA",
            "Lebanon": "LB",
            "Malaysia": "MY",
            "Maldives": "MV",
            "Mongolia": "MN",
            "Myanmar (formerly Burma)": "MM",
            "Nepal": "NP",
            "North Korea": "KP",
            "Oman": "OM",
            "Pakistan": "PK",
            "Palestine": "PS",
            "Philippines": "PH",
            "Qatar": "QA",
            "Saudi Arabia": "SA",
            "Singapore": "SG",
            "South Korea": "KR",
            "Sri Lanka": "LK",
            "Syria": "SY",
            "Taiwan": "TW",
            "Tajikistan": "TJ",
            "Thailand": "TH",
            "Timor-Leste": "TL",
            "Turkmenistan": "TM",
            "United Arab Emirates": "AE",
            "Uzbekistan": "UZ",
            "Vietnam": "VN",
            "Yemen": "YE",
            "Australia": "AU",
            "Fiji": "FJ",
            "Kiribati": "KI",
            "Marshall Islands": "MH",
            "Micronesia": "FM",
            "Nauru": "NR",
            "New Zealand": "NZ",
            "Palau": "PW",
            "Papua New Guinea": "PG",
            "Samoa": "WS",
            "Solomon Islands": "SB",
            "Tonga": "TO",
            "Tuvalu": "TV",
            "Vanuatu": "VU",
            "Antarctica": "AQ",
            "Bouvet Island": "BV",
            "French Southern Territories": "TF",
            "Heard Island and McDonald Islands": "HM",
            "South Georgia and the South Sandwich Islands": "GS",
            "Albania": "AL",
            "Andorra": "AD",
            "Austria": "AT",
            "Belarus": "BY",
            "Belgium": "BE",
            "Bosnia and Herzegovina": "BA",
            "Bulgaria": "BG",
            "Croatia": "HR",
            "Cyprus": "CY",
            "Czech Republic": "CZ",
            "Denmark": "DK",
            "Estonia": "EE",
            "Faroe Islands": "FO",
            "Finland": "FI",
            "France": "FR",
            "Germany": "DE",
            "Gibraltar": "GI",
            "Greece": "GR",
            "Guernsey": "GG",
            "Hungary": "HU",
            "Iceland": "IS",
            "Ireland": "IE",
            "Isle of Man": "IM",
            "Italy": "IT",          
            // Add other countries and their respective code if needed.
          };
          
        const countryCode = countryCodeMapping[country] || country; // Use country code when possible, otherwise fallback on the full name.

        lastRequest.country = country;
        lastRequest.countryCode = countryCode;

        // Part of the original code
        lastRequest.title = title;
        lastRequest.street = heredotcom.items[0].address.street;
        lastRequest.city = heredotcom.items[0].address.city;
        lastRequest.zipcode = heredotcom.items[0].address.postalCode;
        lastRequest.state = heredotcom.items[0].address.state;
        lastRequest.country2 = ` - ${heredotcom.items[0].address.country}`;


    } catch (error) {
        console.log("getHEREdotcom request failed or something.", error);
    }
}


//don't touch this either =p
http.listen(config.PORT, () => {
    console.log(`listening on *:${config.PORT}`);
});
