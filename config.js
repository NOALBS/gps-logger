// index.js
"use strict";

// PORT to access webpage example => http://localhost:3000
// Don't forget to Open/Forward your PORTS!
const PORT = 3000;

// Get a Code here => https://www.randomcodegenerator.com/en/generate-codes or make up your own.
// Add &key=<UNIQUE_CODE> at the end of your GPS-LOGGER 'custom url' URL, this will secure your data and everything in turn needs this key to access data and send data.
// My Custom URL in GPS-Logger looks like this: http://<YOUR-IP-or-DNS>:3000/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT&key=<UNIQUE_CODE>
// If you want to access the gps-logger from outside your local network you'll need to add ?key=<UNIQUE-CODE> to the end of the URL, for example http://<YOUR-WAN-IP>:<PORT>/map?key=<UNIQUE-CODE>
// This could be a neat tool to give to your most trusted MODs.
const UNIQUE_CODE = '<YOUR-UNIQUE-CODE>';

// API Rate limit in milliseconds, 5000 = 5 seconds.
// This will limit how often then gps-logger calls upon the APIs, becareful, if too frequent you will rack up requests and may go over your free credit allowment with some of these APIs.
const RATELIMIT = 10000;

// Choose your metrics (imperial or metric)
const UNITS = 'imperial';

// API Key from => http://OpenWeatherMap.org
const OWM_Key = '<YOUR-OPENWEATHERMAP-KEY>';

// Get AppID from => https://developer.here.com/sign-up?create=Freemium-Basic&keepState=true&step=account
const HERE_appid = '<YOUR-HERE-APP-ID>';

// Get AppCode from => https://developer.here.com/sign-up?create=Freemium-Basic&keepState=true&step=account
const HERE_appcode = '<YOUR-HERE-APP-CODE>';

// Create or Download a map style from => https://SnazzyMaps.com/Explore and save it as a .json in the maps_style folder,
// For example you create a style save it as my_style.json you would put 'my_style' below.
const MAPSTYLE = 'style_dark';

// Google Maps Javascript API Key => https://developers.google.com/maps/documentation/javascript/get-api-key
// you will need to have a vaild credit card attached to your Google Developer Account for this to work..
// but don't worry Google provides a set free credit amount every month, using just this should never make you go over that amount, like ever.
const GOOGLEAPI = '<YOUR-GOOGLE-MAPS-JAVASCRIPT-API>';

exports.PORT = PORT, exports.UNIQUE_CODE = UNIQUE_CODE, exports.RATELIMIT = RATELIMIT, exports.UNITS = UNITS, exports.OWM_Key = OWM_Key, exports.HERE_appid = HERE_appid, exports.HERE_appcode = HERE_appcode, exports.MAPSTYLE = MAPSTYLE, exports.GOOGLEAPI = GOOGLEAPI;

//# sourceMappingURL=index.js.map
