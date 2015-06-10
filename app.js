
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
var io = require('socket.io').listen(8080, {
    log: true
});

console.log("PID :"+process.pid);
var clients={};
var pseudos=[];
var doc="";
io.on('connection',function(socket){
	socket.id=socket.request.connection.remoteAddress;
	console.log('connexion from ip :'+socket.request.connection._peername.address+' on port '+socket.request.connection._peername.port);
	// socket.id=socket.request.connection._peername.address;
	// socket.id=socket.request.connection.remoteAddress;
	// socket.id=socket.handshake.address;
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

	});
	socket.on('deco',function(){io.sockets.emit('remove_user',clients[socket.id].pseudo);
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
		socket.broadcast.emit('update_doc',doc);
	});
	
	
	
});

