const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const config = require("./config.json");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/log", (req, res) => {
    io.emit("data", req.query);
    res.sendStatus(200);
});

http.listen(config.port, () => {
    console.log(`listening on *:${config.port}`);
});
