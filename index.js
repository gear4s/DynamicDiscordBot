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
                    if(!discmd[cmd]) discmd[cmd] = {functions: [], requires: {}}
                    console.log(`Received ${msgs.size} messages from ${chan.join('-')}`)
                    var i = messages.length
                    while(i--) {
                      var msg = messages[i].content.split("```")
                      discmd[cmd][msg[0]] = msg[1].substring(msg[1].substring(0,10) == "javascript" ? 11 : 0)
                    }
                  } break;

                case "inc":
                  {
                    var cmd = chan[1]
                    if(!discmd[cmd]) discmd[cmd] = {functions: [], requires: {}}
                    console.log(`Received ${msgs.size} messages from ${chan.join('-')}`)
                    messages[0].content.split("\n").forEach(function(msg) {
                      var code = msg.split(":")
                      if(typeof code[1] == "undefined") {
                        // name is same as require
                        code[1] = code[0]
                      }
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
                    })
                  } break;

                case "func":
                  {
                    var cmd = chan[1]
                    console.log(`Received ${msgs.size} messages from ${chan.join('-')}`)
                    if(!discmd[cmd]) discmd[cmd] = {functions: [], requires: {}}
                    var i = messages.length
                    while(i--) {
                      var msg = messages[i].content.split("```")
                      discmd[cmd].functions.push(msg[1].substring(11))
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

          const cb = discmd[cmdTxt].functions.join("\n") + discmd[cmdTxt].callback
          console.log(cb)
          safeEval(cb, {
            msg: msg,
            client: client,
            console: console,
            discordapi: Discord,
            JSON: JSON,
            parseInt: parseInt,
            Math: Math,
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