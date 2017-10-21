const safeEval = require('notevil')
const Discord = require("discord.js");
const clone = require("clone")
const client = new Discord.Client();

process.on('unhandledRejection', (reason) => {
  console.error(reason);
  process.exit(1);
});

var discmd = {}
var includes = {
  cmd: {},
  mod: {}
}

var ready = false
client.on("ready", () => {
  console.log("Logged in!");
  var chans = client.channels.array()

  var t = 0, j = 0;
  for(var i = 0; i < chans.length; i++) {
    if(chans[i].type == "text") {
      j++
      chans[i]
        .fetchMessages()
        .then(
          msgs => {
            var messages = msgs.array()
            if(messages[0]) {
              var chan = messages[0].channel.name.split("-")
              switch(chan[0]) {
                case "cmd":
                  {
                    var cmd = chan[1]
                    if(!discmd[cmd]) discmd[cmd] = {}
                    console.log(`Received ${msgs.size} messages`)
                    var i = messages.length
                    while(i--) {
                      var msg = messages[i].content.split("```")
                      discmd[cmd][msg[0]] = msg[1].substring(msg[1].substring(0,10) == "javascript" ? 11 : 0)
                    }
                  } break;

                case "inc":
                  {
                    var cmd = chan[1]
                    if(!discmd[cmd]) discmd[cmd] = {requires: {}}
                    console.log(`Received ${msgs.size} messages`)
                    var msg = messages[0].content.split("\n")
                    for(var i in msg) {
                      var code = msg[i].split(":")
                      if(typeof includes.mod[code[1]] == "undefined") {
                        console.log("New module required: " + code[1])
                        includes.mod[code[1]] = require(code[1])
                      }
                      if(typeof includes.cmd[cmd] == "undefined") {
                        console.log("Loaded new command reference table for command:", cmd)
                        includes.cmd[cmd] = {}
                      }
                      console.log("New command module referenced:", code[1])
                      includes.cmd[cmd][code[0]] = includes.mod[code[1]]
                      console.log(typeof includes.cmd[cmd][code[0]], cmd, code[0], code[1])
                    }
                  } break;

                default: {}
              }
            }
            t++
            if(t == j) {console.log("Ready to accept commands sir!"); ready = true}
          }
        )
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
  // make sure bot is ready to accept commands
  if(ready) {
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

      if(cmd) {
        try {
          msg.__rep = msg.reply
          msg.reply = function(txt) {
            this.__rep(txt).then(msg => console.log(`Sent message to ${msg.author}: ${txt}`)).catch(console.error)
          }
          console.log(includes.cmd[cmdTxt])
          safeEval(discmd[cmdTxt].callback, {
            msg: msg,
            client: client,
            console: console,
            discordapi: Discord,
            requires: clone(includes.cmd[cmdTxt])
          })
        } catch(e) {
          msg.reply("unfortunately, the developer that made that specific command made a mistake! Please contact him for assistance :)")
          console.log(e)
        }
      }
    }
  }
});
client.on("messageUpdate", (oldMessage, newMessage) => {
});
client.login('your.api-key');