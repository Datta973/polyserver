var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
let Mahou = require("./lib/quadtree.js")
// let SAT = require('./lib/SAT.js')

let boundary = new Mahou.Rectangle(1500, 1500, 1500, 1500);



let qTree = new Mahou.QuadTree(boundary, 5);

let players = {};
// let pellets = [];
let requiredPelletData = [];
let collidedPellets = [];

let viewport = new Mahou.Rectangle(0, 0, 0, 0);
let collisionport = new Mahou.Rectangle(0, 0, 0, 0);
let points_sc = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 68, 93, 120];
let temp_data = {};
let world_width = 3072, world_height = 3072;
let speed = 10;
let projectile_speed = 0.3;
let projectile_range = 130;
let test_var = 10;

//temp variables 

let temp = 0;
let tempNum = 0;
let tempCos = 0;
let tempSin = 0;
let tempX = 0;
let tempY = 0;

// let V = SAT.Vector;
// let P = SAT.Polygon;
// let C = SAT.Circle;

let ran_names = ["Garry", "Emmett", "Hank", "Vincenzo", "Cornell", "Darryl", "Arturo", "Jewell", "Kent", "Luigi", "Haywood", "King", "Lonnie", "Renaldo", "Johnny", "Tad", "Abel", "Matt", "Shirley", "Valentin", "Nelson", "Vicente", "Keneth", "Darell", "Anton", "Theron", "Dana", "Israel", "Newton", "Willis", "Scot", "Erasmo", "Barney", "Charley", "Louie", "Sylvester", "Johnathan", "Laverne", "Zachery", "Arlen", "Sydney", "Luke", "Keith", "Jc", "Harland", "Monty", "Chas", "Tanner", "Kim", "Dwayne", "Veronica", "Marna", "Tina", "Denisha", "Mechelle", "Fatimah", "Marva", "Valrie", "Danelle", "Fernande"]
let used_names = [];
let plyr = {};
let playerCount = 0;

const RAD = (Math.PI / 180);



let bots = [{ id: "001", username: "Krish" }, { id: "002", username: "Sekai" }, { id: "003", username: "Pro Boy" }, { id: "004", username: "Nyan Cat" }, { id: "005", username: "Bigg Brother" }, { id: "006", username: "Good boi" }];

for (var i = 0; i < 480; i++) {
    qTree.insert({ x: Math.floor(Math.random() * 3000), y: Math.floor(Math.random() * 3000), radius: 10 });
}

// app.use(express.static("src"))

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});



for (let bot of bots) {
    insertBot(bot);
}


function insertBot(bot) {
    // used_names.push(ran_names.splice(ran_names.indexOf(rand_name),1)[0]);
    players[bot.id] = {
        id: bot.id,
        x: random(3000),
        y: random(3000),
        angle: 0,
        tip: { x: 0, y: 0 },
        experience: 0,
        level: 1,
        freezed: false,
        nitro: false,
        alive: true,
        username: bot.username,
        score: 0,
        bot: true,
        invincible: true,
        cool_counter: 0
    }
    temp_data[bot.id] = {
        clientWidth: 1024,
        clientHeight: 1024,
        angle: random(90, 180),
        isFiring: false,
        back: false,
        level: 1,
        botNearest: {},
        waste: 0,
        fireTime: 0
    }
    setTimeout(function () {
        if (players[bot.id]) players[bot.id].invincible = false;
    }, 4400)
}



io.on('connection', function (socket) {
    playerCount++;
    // players[socket.id] = {
    //     x: 0,
    //     y: 0,
    //     angle: 0,
    //     tip: { x: 0, y: 0 },
    //     experience: 0,
    //     level: 1,
    //     freezed: false,
    //     nitro: false,
    //     dead: false,
    // }

    // temp_data[socket.id] = {
    //     clientWidth: 1024,
    //     clientHeight: 1024,
    //     angle: 0,
    //     isFiring: false,
    //     back: false
    // }

    // polys[socket.id] = new P(new V(), [
    //     new V(0, 0), new V(30, 0), new V(0, 30)
    // ]);

    // circles[socket.id] = new C(new V(), 32);
    socket.on("s_ping",function(){
        socket.emit("s_pong");
    })

    socket.on("p_count",function(){
        socket.emit("p_count",playerCount)
    })

    socket.on("start_game", function (data) {

        players[socket.id] = {
            x: random(3000),
            y: random(3000),
            angle: 0,
            tip: { x: 0, y: 0 },
            experience: 0,
            level: 1,
            freezed: false,
            nitro: false,
            alive: true,
            username: data.username.replace(/<[^>]*>/, ""),
            score: 0,
            invincible: true,
            cool_counter: 0
        }
        temp_data[socket.id] = {
            clientWidth: 1024,
            clientHeight: 1024,
            angle: 0,
            isFiring: false,
            back: false,
            level: 1,
            
            waste: 0,
            fireTime: 0
        }

        temp_data[socket.id].clientWidth = data.clientWidth;
        temp_data[socket.id].clientHeight = data.clientHeight;
        //console.log(socket.id)
        setTimeout(function () {
            if (players[socket.id]) players[socket.id].invincible = false;
        }, 4400)


    })

    socket.on('disconnect', function () {
        socket.removeAllListeners("update_data");
        socket.removeAllListeners('fire');
        playerCount--;
        delete players[socket.id];
        delete temp_data[socket.id];
    })

    socket.on('update_data', function (data) {
        for (var prop in data) {
            players[socket.id][prop] = data[prop];
        }
    })

    socket.on("fire", function () {
        if (players[socket.id].freezed || players[socket.id].cool_counter != 0) return;
        temp_data[socket.id].isFiring = true;
        temp_data[socket.id].angle = players[socket.id].angle;
        players[socket.id].freezed = true;
        players[socket.id].cool_counter = 5 * temp_data[socket.id].level;
    })


    // socket.on("key_left", function (key) {
    //     players[socket.id].speedX = -4 * key;
    // })
    // socket.on("key_up", function (key) {
    //     players[socket.id].speedY = -4 * key;
    // })
    // socket.on("key_right", function (key) {
    //     players[socket.id].speedX = 4 * key;
    // })
    // socket.on("key_down", function (key) {
    //     players[socket.id].speedY = 4 * key;
    // })
    // socket.on("level_inc", function () {
    //     players[socket.id].level += 1;
    // })


});





function resend() {
    for (var player in players) {
        players[player].cool_counter -= players[player].cool_counter <= 0 ? 0 : 1;
        tempCos = Math.cos(RAD * -(temp_data[player].angle - 90));
        tempSin = Math.sin(RAD * -(temp_data[player].angle - 90));
        tempX = ((temp_data[player].level * test_var) + projectile_range) * tempCos;
        tempY = ((temp_data[player].level * test_var) + projectile_range) * tempSin;
        if (temp_data[player].isFiring) {

            if (temp_data[player].fireTime <= 2 && temp_data[player].back != true) {
                temp_data[player].fireTime++;
                players[player].tip.x += tempX * projectile_speed;
                players[player].tip.y -= tempY * projectile_speed;

                for (var enemy in players) {
                    if (enemy != player && players[enemy].alive) {
                        if (dist({ x: players[player].x + players[player].tip.x, y: players[player].y + players[player].tip.y }, players[enemy]) < ((players[player].level + 2) * 4) + 68 && !players[enemy].invincible && !players[player].invincible) {

                            players[enemy].alive = false;
                            // players[player].experience += Math.floor(players[enemy].experience / 2);
                            // while (players[player].experience >= points_sc[players[player].level]) {
                            //     players[player].level++;
                            // }
                            // players[player].score += Math.floor(players[enemy].score / 2);
                            temp = (players[enemy].experience / 0.25) / 2 + 5;
                            tempNum = Math.sqrt(temp) * 15;
                            for (var i = 0; i < temp/1.5; i++) {
                                qTree.insert({ x: random(players[enemy].x - tempNum, players[enemy].x + tempNum), y: random(players[enemy].y - tempNum, players[enemy].y + tempNum), radius: 15 });
                            }

                            if (players[enemy].bot) {
                                insertBot(players[enemy]);
                            } else {
                                io.to(enemy).emit("death");
                            }


                        }
                    }
                }

                // var points = [];
                // polys[player].pos = new V(players[player].x + players[player].tip.x + rcos((players[player].level + 2) * 7 * Math.cos(Math.PI / (players[player].level + 2)) + 34, -(players[player].angle - 90)), players[player].y + players[player].tip.y + rsin(-((players[player].level + 2) * 7 * Math.cos(Math.PI / (players[player].level + 2)) + 34), -(players[player].angle - 90)));

                // points.push(new V(polys[player].pos.x + (players[player].level + 2) * 7, polys[player].pos.y));

                // for (var i = 1; i < (players[player].level + 2); i++) {
                //     points.push(new V(polys[player].pos.x + (players[player].level + 2) * 7 * Math.cos(i * (Math.PI * 2) / (players[player].level + 2)), polys[player].pos.y + (players[player].level + 2) * 7 * Math.sin(i * (Math.PI * 2) / (players[player].level + 2))));
                // }

                // polys[player].setPoints(points);

                // polys[player].rotate(d2r(players[player].angle - 90));

                // for(let enemy in circles){
                //     if(enemy != player){
                //         players[enemy].dead = SAT.testPolygonCircle(polys[player],circles[enemy]);
                //     }
                // }



            } else {

                temp_data[player].back = true;
                if (temp_data[player].fireTime > 0) {
                    temp_data[player].fireTime--;
                    players[player].tip.x -= (((temp_data[player].level * test_var) + projectile_range) * projectile_speed) * tempCos;
                    players[player].tip.y += (((temp_data[player].level * test_var) + projectile_range) * projectile_speed) * tempSin;

                } else {
                    temp_data[player].fireTime = 0;
                    temp_data[player].isFiring = false;
                    temp_data[player].level = players[player].level;
                    players[player].tip.x = 0;
                    players[player].tip.y = 0;
                    players[player].freezed = false;
                    temp_data[player].back = false;


                }
            }
        } else {
            if (players[player].nitro && players[player].experience > 0) {
                players[player].experience -= 0.01;
                temp_data[player].waste += 1;
                if (temp_data[player].waste >= 25) {
                    qTree.insert({ x: Math.floor(Math.random() * 3000), y: Math.floor(Math.random() * 3000), radius: 10 });
                    temp_data[player].waste = 0;
                }
                speed = 11;
                if (players[player].experience < points_sc[players[player].level - 1] && players[player].level != 1) {
                    players[player].level--;
                }
            } else {
                speed = 6;
            }



            players[player].x += speed * Math.cos(RAD * -(players[player].angle - 90));
            players[player].y -= speed * Math.sin(RAD * -(players[player].angle - 90));

            players[player].x = Math.floor(players[player].x);
            players[player].y = Math.floor(players[player].y);

            if (players[player].bot) {
                for (var enemy in players) {
                    if (enemy != player && players[enemy].alive) {
                        if (dist({ x: players[player].x, y: players[player].y }, players[enemy]) < 400 && !players[enemy].invincible) {
                            if (players[player].level > players[enemy].level) {
                                players[player].nitro = false;
                                players[player].angle = (Math.atan2((players[player].y - players[enemy].y), (players[player].x - players[enemy].x)) * 180 / Math.PI - 90);
                                if (dist({ x: players[player].x, y: players[player].y }, players[enemy]) < players[player].level * 100) {
                                    if (!players[player].freezed && players[player].cool_counter == 0) {
                                        temp_data[player].isFiring = true;
                                        temp_data[player].angle = players[player].angle;
                                        players[player].freezed = true;
                                        players[player].cool_counter = 5 * temp_data[player].level;
                                    }
                                }
                            }else{
                                players[player].nitro = true;
                            }
                        }else{
                            players[player].nitro = false;
                        }
                    }
                }
            }

            if (players[player].x >= world_width - 32 + 3) {
                players[player].x = world_width - 32 + 3;
                if (players[player].bot)
                    players[player].angle = random(0, 360)
            } else if (players[player].x <= 32 - 3) {
                players[player].x = 32 - 3;
                if (players[player].bot)
                    players[player].angle = random(0, 360)
            }

            if (players[player].y > world_height - 32 + 3) {
                players[player].y = world_height - 32 + 3;
                if (players[player].bot)
                    players[player].angle = random(0, 360)
            } else if (players[player].y <= 32 - 3) {
                players[player].y = 32 - 3;
                if (players[player].bot)
                    players[player].angle = random(0, 360)
            }

        }

        viewport.x = players[player].x;
        viewport.y = players[player].y;
        viewport.w = temp_data[player].clientWidth;
        viewport.h = temp_data[player].clientHeight;
        requiredPelletData = qTree.query(viewport);
        if(requiredPelletData.length < 20){
            qTree.insert({ x: random(players[player].x - viewport.w/2,players[player].x + viewport.w/2), y: random(players[player].y - viewport.h/2,players[player].y + viewport.h/2), radius: 10 });
        }
        if (!players[player].isFiring) {
            collisionport.x = players[player].x;
            collisionport.y = players[player].y;
            collisionport.w = 64;
            collisionport.h = 64;
            checkCollision(player, qTree.query(collisionport))
        }


        io.to(player).emit('update_data', { player_list: players, food_data: requiredPelletData })
    }
    collidedPellets = [];
    requiredPelletData = [];
    // io.emit('update_data', players);
}

setInterval(resend, 1000 / 30)

function random() {
    if (arguments.length == 0) {
        return Math.random();
    } else if (arguments.length == 1) {
        return Math.floor(Math.random() * arguments[0]);
    } else {
        return Math.floor(Math.random() * (arguments[1] - arguments[0])) + arguments[0];
    }
}

function checkCollision(id, coQualiPellets) {
    plyr = players[id];
    for (let pellet of coQualiPellets) {
        if (dist(plyr, pellet) < 32 + pellet.radius) {
            collidedPellets.push(pellet);
            qTree.remove(pellet);
            
            plyr.experience += pellet.radius == 10 ? 0.25 : 0.5;
            if (plyr.experience >= points_sc[plyr.level]) {
                // plyr.experience -= points_sc[plyr.level];
                plyr.level++;
                temp_data[id].level = plyr.level;
            }
        }
    }
    removePellets();
}

function removePellets() {
    for (let pellet of collidedPellets) {
        requiredPelletData.splice(requiredPelletData.indexOf(pellet), 1)
    }
}

function dist() {
    var a = arguments[0].x - arguments[1].x;
    var b = arguments[0].y - arguments[1].y;
    return Math.sqrt(a * a + b * b);
}

function rcos(r, theta) {
    return r * Math.cos(d2r(theta))
}

function rsin(r, theta) {
    return r * Math.sin(d2r(theta))
}

function d2r(d) {
    var r = d * (Math.PI / 180);
    return r;
}

http.listen(process.env.PORT || 8080)
