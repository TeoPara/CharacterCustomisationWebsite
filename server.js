const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, 'public');
const port = process.env.PORT || 3000
let app = express();
let server = http.createServer(app)
let io = socketIO(server);

const { MongoClient, ObjectId} = require("mongodb");
const Mongo_client = new MongoClient("mongodb://127.0.0.1/admin");

const sockets = [];
// "socket": 
// "username":
// "password":
// "owned": []
// "logged_in": false

app.use(express.static(publicPath));

// server side messages:
//    created
//    update
//    account_register
//        (username, password)
//    account_login
//        (username, password)

// client side messages:
//    warrior
//    refresh
//    account_message


io.on('connection', socket =>
{
    sockets.push({
        "socket": socket,
        "username": null,
        "password": null,
        "owned": [],
        "logged_in": false
    });

    async function SendWarriors(){
        await Mongo_client.connect();
        const cursor= Mongo_client.db("admin").collection("warriors").find();
        await cursor.forEach((a) => {
            socket.emit('warrior', [a.index, a.name, a.armor, a.pants, a.colors]);
        });
    } SendWarriors();
    
    socket.on('account_register', args =>
    {
        async function a()
        {
            console.log("account_register " + String(args[0]) + ", " + String(args[1]) + " Received");
            
            await Mongo_client.connect();
            let col = await Mongo_client.db("admin").collection("accounts");
            
            if (await col.findOne({username: args[0]}) != null)
            {
                socket.emit('account_message', "Aleady taken")
                console.log("account_register " + String(args[0]) + ", " + String(args[1]) + " Stopped - Already Taken");
                return;
            }
            await col.insertOne({
                username: args[0],
                password: args[1],
                owned: []
            });
            
            socket.emit('account_message', "Register completed")
            console.log("account_register " + String(args[0]) + ", " + String(args[1]) + " Completed");
        } a();
    });
    socket.on('account_login', args =>
    {
        async function a()
        {
            console.log("account_login " + String(args[0]) + ", " + String(args[1]) + " Received");

            await Mongo_client.connect();
            let col = await Mongo_client.db("admin").collection("accounts");

            let found = await col.findOne({username: args[0]});
            
            if (found == null)
            {
                socket.emit('account_message', "Doens't exist")
                console.log("account_login " + String(args[0]) + ", " + String(args[1]) + " Stopped - Doesn't exist");
                return;
            }
            if (args[1] != found.password)
            {
                socket.emit('account_message', "Incorrect password")
                console.log("account_login " + String(args[0]) + ", " + String(args[1]) + " Stopped - Incorrect Password. " + args[1] + " =/= " + found.password);
                return;
            }
            if (sockets.find(v => v.socket == socket).logged_in == true)
            {
                socket.emit('account_message', "You're already logged in")
                console.log("account_login " + String(args[0]) + ", " + String(args[1]) + " Stopped - Already logged in");
                return;
            }
            
            sockets.find(v => v.socket == socket).username = found.username;
            sockets.find(v => v.socket == socket).password = found.password;
            sockets.find(v => v.socket == socket).owned = found.owned;
            sockets.find(v => v.socket == socket).logged_in = true;
            
            socket.emit('account_message', "Login completed")
            console.log("account_login " + String(args[0]) + ", " + String(args[1]) + " Completed");
        } a();
    });
    socket.on('account_logout', args =>{
        async function a()
        {
            console.log("account_logout received");
            
            if (sockets.find(v => v.socket == socket).logged_in == false)
            {
                socket.emit('account_message', "You're already logged out")
                console.log("account_logout stopped - Already logged out");
                return;
            }

            sockets.find(v => v.socket == socket).username = null;
            sockets.find(v => v.socket == socket).password = null;
            sockets.find(v => v.socket == socket).owned = null;
            sockets.find(v => v.socket == socket).logged_in = false;

            socket.emit('account_message', "Logout completed")
            console.log("account_logout completed");
        } a();
    });
    
    
    // Character created
    socket.on('created', args =>
    {
        async function LeCreate(){
            await Mongo_client.connect();
            let col = await Mongo_client.db("admin").collection("warriors");
            
            // count
            let counter = await col.count();
            
            console.log("CREATING A NEW ONE");
            
            await col.insertOne({index: Number(counter), name: "John Dane", armor:false, pants:false, colors:[[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]]});
            
            
            let sock = sockets.find(v => v.socket == socket);
            sock.owned.push(counter);
            let col2 = await Mongo_client.db("admin").collection("accounts");
            col2.findOneAndUpdate({username: sock.username}, {$set:{owned: sock.owned}});
        } LeCreate();
        
    });
    
    // Character updated
    socket.on('update', args =>
    {
        console.log("Got update " + args[0] + ", " + args[1] + ", " + args[2] + ", " + args[3] + ", " + args[4])
        async function update()
        {
            if (!sockets.find(v => v.socket == socket).owned.includes(args[0]))
            {
                console.log("|   Denied. Not owned.")
                return;
            }
            
            console.log("|   Connecting to database...")
            await Mongo_client.connect();
            
            console.log("|   Connecting to collection...")
            let col = await Mongo_client.db("admin").collection("warriors");
            
            console.log("|   Finding target warrior...")
            let found = {index: Number(args[0])};
            await col.findOneAndUpdate(found, {$set: {
                name: String(args[1]),
                armor: Boolean(args[2]),
                pants: Boolean(args[3]),
                colors: [
                    [
                        Number(args[4][0][0]),
                        Number(args[4][0][1]),
                        Number(args[4][0][2])
                    ],
                    [
                        Number(args[4][1][0]),
                        Number(args[4][1][1]),
                        Number(args[4][1][2])
                    ],
                    [
                        Number(args[4][2][0]),
                        Number(args[4][2][1]),
                        Number(args[4][2][2])
                    ]
                ]
            }});
            console.log("|   Updated target warrior.")

            sockets.forEach((c) => {
                c.socket.emit('refresh');
            });
            console.log("|   Sent refresh to clients.")
            
            for (let c in col) {
                sockets.forEach((cc) => {
                    cc.socket.emit('warrior', [c.index, c.name, c.armor, c.pants, c.colors]);
                });
            };
            console.log("|   Sent update to clients.")
            
            console.log("|   All Done.")

        } update();
    });
});


server.listen(port, () => { console.log(`server is up on port ${port}`); });