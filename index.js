const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
secret: "deskymeet-secret",
resave: false,
saveUninitialized: true
}));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({

destination: function(req, file, cb){
cb(null, "uploads/");
},

filename: function(req, file, cb){
cb(null, Date.now() + "-" + file.originalname);
}

});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {

res.sendFile(path.join(__dirname, "public", "index.html"));

});

app.post("/upload", upload.single("photo"), (req, res) => {

const username = req.body.username;
const email = req.body.email;
const password = req.body.password;
const photo = req.file.filename;

const users = JSON.parse(
fs.readFileSync("data/users.json")
);

const existingUser = users.find(user =>
user.email === email
);

if(existingUser){

return res.send(`
<h1 style="background:black;color:white;
font-family:Arial;text-align:center;
padding-top:50px;">

Email already exists ❌

</h1>
`);

}

const newUser = {
username,
email,
password,
photo
};

users.push(newUser);

fs.writeFileSync(
"data/users.json",
JSON.stringify(users, null, 2)
);

req.session.user = newUser;

res.redirect("/matches");

});

app.post("/login", (req, res) => {

const email = req.body.email;
const password = req.body.password;

const users = JSON.parse(
fs.readFileSync("data/users.json")
);

const foundUser = users.find(user =>
user.email === email &&
user.password === password
);

if(foundUser){

req.session.user = foundUser;

res.redirect("/matches");

}else{

res.send(`
<body style="background:black;color:white;
font-family:Arial;text-align:center;
padding-top:50px;">

<h1>Invalid email or password ❌</h1>

</body>
`);

}

});

app.get("/matches", (req, res) => {

if(!req.session.user){

return res.redirect("/login.html");

}

const currentUser = req.session.user;

const users = JSON.parse(
fs.readFileSync("data/users.json")
);

let profiles = "";

users.forEach(user => {

if(user.email !== currentUser.email){

profiles += `

<div class="card">

<img src="/uploads/${user.photo}">

<h2>${user.username}</h2>

<p>Active member ❤️</p>

<form action="/connect" method="POST">

<input
type="hidden"
name="targetEmail"
value="${user.email}">

<button type="submit">

Connect ❤️

</button>

</form>

</div>

`;

}

});

res.send(`

<!DOCTYPE html>

<html>

<head>

<title>Matches</title>

<style>

body{
background:black;
color:white;
font-family:Arial;
text-align:center;
padding:20px;
}

.card{
background:#111;
padding:20px;
margin:20px auto;
max-width:350px;
border-radius:20px;
}

img{
width:140px;
height:140px;
border-radius:50%;
object-fit:cover;
}

button{
padding:15px 30px;
border:none;
background:#ff0066;
color:white;
border-radius:10px;
margin-top:10px;
}

</style>

</head>

<body>

<h1>Welcome ${currentUser.username} ❤️</h1>

<br>

<button onclick="window.location.href='/requests'">

View Requests ❤️

</button>

<button onclick="window.location.href='/logout'">

Logout ❌

</button>

<br><br>

${profiles}

</body>

</html>

`);

});

app.post("/connect", (req, res) => {

if(!req.session.user){

return res.redirect("/login.html");

}

const requests = JSON.parse(
fs.readFileSync("data/requests.json")
);

const newRequest = {

from: req.session.user.email,

to: req.body.targetEmail

};

requests.push(newRequest);

fs.writeFileSync(
"data/requests.json",
JSON.stringify(requests, null, 2)
);

res.send(`

<body style="background:black;
color:white;
font-family:Arial;
text-align:center;
padding-top:50px;">

<h1>Connection request sent ❤️</h1>

<br>

<button onclick="window.location.href='/matches'">

Back to Matches

</button>

<style>

button{
padding:15px 30px;
background:#ff0066;
color:white;
border:none;
border-radius:10px;
font-size:16px;
}

</style>

</body>

`);

});

app.get("/requests", (req, res) => {

if(!req.session.user){

return res.redirect("/login.html");

}

const currentUser = req.session.user;

const requests = JSON.parse(
fs.readFileSync("data/requests.json")
);

const users = JSON.parse(
fs.readFileSync("data/users.json")
);

let requestCards = "";

requests.forEach(request => {

if(request.to === currentUser.email){

const sender = users.find(user =>
user.email === request.from
);

if(sender){

requestCards += `

<div class="card">

<img src="/uploads/${sender.photo}">

<h2>${sender.username}</h2>

<p>Wants to connect ❤️</p>

<button>

Accept ❤️

</button>

</div>

`;

}

}

});

res.send(`

<!DOCTYPE html>

<html>

<head>

<title>Requests</title>

<style>

body{
background:black;
color:white;
font-family:Arial;
text-align:center;
padding:20px;
}

.card{
background:#111;
padding:20px;
margin:20px auto;
max-width:350px;
border-radius:20px;
}

img{
width:140px;
height:140px;
border-radius:50%;
object-fit:cover;
}

button{
padding:15px 30px;
border:none;
background:#ff0066;
color:white;
border-radius:10px;
margin-top:10px;
}

</style>

</head>

<body>

<h1>Connection Requests ❤️</h1>

<button onclick="window.location.href='/matches'">

Back to Matches

</button>

<br><br>

${requestCards || "<p>No requests yet</p>"}

</body>

</html>

`);

});

app.get("/logout", (req, res) => {

req.session.destroy(() => {

res.redirect("/");

});

});

app.listen(3000, () => {

console.log("Deskymeet running on port 3000");

});
