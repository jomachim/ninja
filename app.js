/*
NINJA.JS : 
-socket.io
-nodemon
-github
PLEASE ITERATE VERSION NUMBER BELOW

*/

var version="0.2(beta)";
var vdate=new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

var io = require('socket.io').listen(8080, {
    log: true
});

console.log("PID :"+process.pid);
console.log('STARTING APP.JS v.'+version+' @'+vdate);
var clients={};
var pseudos=[];
var doc="";
var fs = require('fs');
fs.watchFile("index.php",function (curr, prev) {
  console.log('the current mtime is: ' + curr.mtime);
  console.log('the previous mtime was: ' + prev.mtime);
  if(curr.mtime!=prev.mtime){console.log('index.php changé');io.sockets.emit('new_html_version');}
});
load_doc('doc.txt');
io.on('connection',function(socket){
	socket.id=socket.request.connection._peername.address;//+":"+socket.request.connection._peername.port;
	console.log('connexion from ip :'+socket.request.connection._peername.address+' on port '+socket.request.connection._peername.port);
	// socket.id=socket.request.connection._peername.address;
	// socket.id=socket.request.connection.remoteAddress;socket.request.connection.remoteAddress
	// socket.id=socket.handshake.address;

// versionning
socket.emit('version',version);
console.log('emiting version number '+version);
socket.emit('update_doc',doc);console.log('emiting doc '+version);
	if(typeof clients[socket.id]=="undefined"){
		console.log("creation nouveau client");
		clients[socket.id]=socket;
	}else{
		
		if(typeof clients[socket.id].pseudo=="undefined"){
			console.log("new anonymous client from "+socket.id+" waiting for login");
		}else{
			socket.emit('reconnection',clients[socket.id].pseudo);
			// socket=clients[socket.id];
			console.log("tentative de reconnection de "+clients[socket.id].pseudo);
		
		}
	}
	function send_users(){
		for(pseudo in clients){
			io.sockets.emit('add_user',clients[pseudo].pseudo);
			save_to_file();
		}
	}
	socket.on('login',function(pseudo){
		console.log("transaction en cours...");
		if(typeof clients[socket.id].pseudo=="undefined"){
			clients[socket.id].pseudo=pseudo;socket.emit('logged',pseudo);send_users();

		}else{
			socket.emit('logged',pseudo);send_users();socket.emit('update_doc',doc);
		}
		
	});
	socket.on('reconnection',function(pseudo){
		console.log(pseudo+" se reconnecte");
		send_users();
		socket.emit('update_doc',doc);

	});
	socket.on('deco',function(){
		io.sockets.emit('remove_user',clients[socket.id].pseudo);
		console.log(clients[socket.id].pseudo+" se déconnecte.");
		clients[socket.id]={};
		//delete clients._[socket.id];
	});
	socket.on('endtransaction',function(p){
		console.log('transaction ok pour '+p);
	});
	socket.on('disconnect',function(){
		io.sockets.emit('remove_user',clients[socket.id].pseudo);
		console.log('connection perdue avec '+clients[socket.id].pseudo)

	});


	socket.on('change_doc',function(text){
		doc=text;
		update_doc('doc.txt',text);
		socket.broadcast.emit('update_doc',doc);
	});
	
	
	
});


function load_doc(txt){var fs = require('fs');
	fs.readFile(txt, 'utf8', function(err, data) {
  		if (err) throw err;
  		console.log('Loaded OK: ' + txt);
  		doc=data;
  		
	});
}
function update_doc(name,txt){var fs = require('fs');
	var docstream = fs.createWriteStream(name);
	docstream.write(txt);
	docstream.end(function () { console.log(name+' sauvée.');
		load_doc(name) });
}

function save_to_file(){
	var fs = require('fs');
	var wstream = fs.createWriteStream('sauvegarde.txt');
	for(pseudo in clients){
				wstream.write(pseudo+'@'+clients[pseudo].pseudo+'\n');
			}

	wstream.end(function () { console.log('liste des pseudo sauvée.'); });
}
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) console.log('App will now TERMINATE');save_to_file();update_doc('doc.txt',doc) ;process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
