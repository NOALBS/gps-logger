# gps-logger by 715209
# live-map by b3ck

Download and install this on your android phone:
https://github.com/mendhak/gpslogger/releases

Once it's started go into the settings and turn everything off for logging besides custom url which should look like this:
`http://<YOUR-IP-or-DNS>:3000/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT`
  
- 1.) On your PC clone or download this GIT
- 2.) Run the 'npm install --production.bat'
- 3.) In order for all of the APIs to work you'll need to edit the `config.js`, links are in the config for the APIs.
  > After signing up for HERE.com enable JS REST, and it will generate an 'APP ID' and 'APP CODE' this is what you want to use in the 'config.js' file.
  
  > [Generate APP ID & APP CODE EXAMPLE](https://i.imgur.com/fntXNfV.png/)
  
  > [JS REST APP ID & APP CODE EXAMPLE](https://i.imgur.com/74eEKEr.png/)

- 4.) Also in the `config.js` is a section for a 'UNIQUE_CODE', if you want to protect access to the GPS-LOGGER either generate it or put in your own code, if not then leave it blank;

  Get a Code here => https://www.randomcodegenerator.com/en/generate-codes or make up your own.
  
  Add `&key=<UNIQUE_CODE>` at the end of your GPS-LOGGER 'custom url' URL, this will secure your data and everything in turn needs this key to access data and send data.
  
  My Custom URL in GPS-Logger looks like this: ```http://<YOUR-IP-or-DNS>:<PORT>/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT&key=<UNIQUE_CODE>```
  
  If you want to access the gps-logger from outside your local network you'll need to add `?key=<UNIQUE-CODE>` to the end of the URL, for example ```http://<YOUR-IP-or-DNS>:<PORT>/map?key=<UNIQUE-CODE>```
  
  This could be a neat tool to give to your most trusted MODs just in case something happens to you, they 'could' provide emergency services with your exact location.

- 5.) [Open and Forward your ports](https://www.noip.com/support/knowledgebase/general-port-forwarding-guide/), otherwise all of this won't work.
- 6.) Run 'npm start.bat' to start the gps-logger server
  
It should say something like this:

```
PS C:\github\gps-logger> npm start
gps-logger@2.0.0 start C:\github\gps-logger
node app
listening on *:3000
```

 > Now browse to http://localhost:3000
 > - or http://localhost:3000/stats/citystate
 > - or http://localhost:3000/stats/a
 > - or http://localhost:3000/stats/b

 > Other links to know:
 > - http://localhost:3000/map
 > - > is your regular map

 > - http://localhost:3000/map_rotate
 > - > is a basic attempt to make the map rotate depending on your current direction, you will need to add &d=%DIR to your Custom URL in the GPS-LOGGER app on your phone, before the UNIQUE-CODE. ```ex; http://<YOUR-IP-or-DNS>:<PORT>/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT&d=%DIR&key=<UNIQUE_CODE>```

 > - http://localhost:3000/mod_map
 > - > this will show a map with all details and stats to help your most trusted MODs in an emergency situtation.
 > - > MODs can access this from: ```http://<YOUR-IP-or-DNS>:<PORT>/mod_map?key=<UNIQUE-CODE>```

Now just pull whatever you want into your OBS Scene, and Bob's your uncle. :man:

  > Please keep in mind I just left everything styled like I have it in my stream, to truly make it your own all it takes is a little tinkering with CSS.

If you have any issues feel free to submit them here on GitHub, or message me on Discord.
- To see it in action check out my livestream or VODs @ https://twitch.tv/b3ck



