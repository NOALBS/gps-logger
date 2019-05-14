const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const config = require("./config.json");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/log", (req, res) => {
    if (req.query.altitude) {
        req.query.altitude = `${Math.round(req.query.altitude / 0.3048)} FT`;
    }

    if (req.query.speed) {
        req.query.speed = `${Math.floor(req.query.speed * 1.609344)} MPH`;
    }

    if (req.query.battery) {
        req.query.battery = `${Math.round(req.query.battery)}%`;
    }

    io.emit("data", req.query);
    res.sendStatus(200);
});

http.listen(config.port, () => {
    console.log(`listening on *:${config.port}`);
});
