const blizzard = require('blizzard.js').initialize({ apikey: 'api-key' });
const safeEval = require('notevil')
const Discord = require("discord.js");
const client = new Discord.Client();


process.on('unhandledRejection', (reason) => {
  console.error(reason);
  process.exit(1);
});

var discmd = {}
var includes = {}

client.on("ready", () => {
	console.log("Logged in!");
	var chans = client.channels.array()

	for(var i = 0; i < chans.length; i++) {
		var chan = chans[i];
		if(chan.name.split("-")[0] == "cmd") {
			cmd = chan.name.split("-")[1]
			discmd[cmd] = {
				requires: {}
			}
			chan.fetchMessages()
			    .then(messages => {
		  		    console.log(`Received ${messages.size} messages`)
		  		    messages = messages.array()
		  		    var i = messages.length
		  		    while(i--) {
		  		    	var msg = messages[i].content.split("```")
		  		    	discmd[cmd][msg[0]] = msg[1].substring(msg[1].substring(0,10) == "javascript" ? 11 : 0)
		  		    }
			    })
			    .catch(console.error);
		} else if(chan.name.split("-")[0] == "mod") {
			cmd = chan.name.split("-")[1]
			chan.fetchMessages()
			    .then(messages => {
		  		    console.log(`Received ${messages.size} messages`)
		  		    messages = messages.array()
		  		    var msg = messages[0].content.split("\n")
		  		    for(var i in msg) {
	  		    		var code = msg[i].split(":")
	  		    		includes[code[1]] = require(code[1])
	  		    		discmd[cmd].requires[code[0]] = includes[code[1]]
		  		    }

			    })
			    .catch(console.error);
		}
	}
});

client.on("channelDelete", (chan) => {

});

client.on("disconnected", () => {
	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error
});

client.on("message", (msg) => {
	//check if message is a command
	if(msg.author.id != client.user.id && (msg.content.startsWith("!"))) {
        console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space
        if(msg.isMentioned(client.user)){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(client.user.mention().length+cmdTxt.length+2);
			} catch(e){ //no command
				msg.channel.send("Yes?");
				return;
			}
        }
		var cmd = discmd[cmdTxt];

		safeEval(discmd[cmdTxt].callback, {
			msg: msg,
			client: client,
			requires: discmd[cmdTxt].requires
		})
	}
});
client.on("messageUpdate", (oldMessage, newMessage) => {
	//console.log(oldMessage, newMessage);
});

client.login('your.api-key');