# gps-logger

Download and install this on your android phone:
https://github.com/mendhak/gpslogger/releases

Once it's started go into the settings and turn everything off for logging besides custom url which should look like this:
`http://<YOUR-IP-or-DNS>:3000/log?s=%SPD&b=%BATT&lat=%LAT&lon=%LON&a=%ALT`
  
- 1.) On your PC clone or download this GIT
- 2.) Run the 'npm install --production.bat'
- 3.) In order for all of the APIs to work you'll need to edit the `config.js`, links are in the config for the APIs.
- 4.) [Open and Forward your ports](https://www.noip.com/support/knowledgebase/general-port-forwarding-guide/), otherwise all of this won't work.
- 5.) Run 'npm start.bat' to start the gps-logger server

It should say something like this:

```
PS C:\github\gps-logger> npm start
gps-logger@1.0.0 start C:\github\gps-logger
node app
listening on *:3000
```

Now browse to http://localhost:3000
- or http://localhost:3000/stats/citystate
- or http://localhost:3000/stats/a
- or http://localhost:3000/stats/b

etc.. etc..

Now just pull whatever you want into your OBS Scene, and Bob's your uncle. :man:

If you have any issues feel free to submit them here on GitHub.
