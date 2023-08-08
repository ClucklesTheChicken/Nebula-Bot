const Canvas = require("canvas");
const Discord = require("discord.js");
var axios = require('axios');
var jimp = require("jimp");
var path = require('path');
const background = path.resolve( __dirname, "../img/nebula.jpg" );
const dim = {
    height: 675,
    width: 1200,
    margin: 50
}
const av = {
    size: 256,
    x: 480,
    y: 170
}

const generateImage = async (member) => {
    let username = member.user.username;
    let avatarURL = member.user.displayAvatarURL({extension: "png"});
    
    const canvas = Canvas.createCanvas(dim.width, dim.height);
    const ctx = canvas.getContext("2d");

    //draw in background
    const backimg = await Canvas.loadImage(background);
    ctx.drawImage(backimg,0,0);
    // var sizeOf = require('buffer-image-size');
    // var dimensions = sizeOf(avatarURL);
    // draw black tinted box
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(dim.margin, dim.margin, dim.width - 2 * dim.margin, dim.height - 2 *dim.margin);

    const avimg = await Canvas.loadImage(avatarURL);
    ctx.save()

    ctx.beginPath()
    ctx.arc(av.x + av.size / 2, av.y +av.size / 2, av.size / 2, 0, Math.PI *2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avimg, av.x, av.y, 256,256);
    ctx.restore();

    ctx.fillStyle ="white";
    ctx.textAlign = "center";

    ctx.font = "50px Sans";
    ctx.fillText("Welcome", dim.width/2, dim.margin +70);

    ctx.font = "60px Sans";
    ctx.fillText(username, dim.width/2, dim.height - dim.margin - 125);

    ctx.font = "40px Sans";
    ctx.fillText("What a cunt", dim.width/2, dim.height - dim.margin - 50);

    const attachment = canvas.toBuffer();
    return attachment;
}

module.exports = generateImage;