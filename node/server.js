// Requires request for HTTP requests
const request = require('request');
// Requires fs to write synthesized speech to a file
const fs = require('fs');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const Bagpipe = require('bagpipe');
const util = require('util');
const path = require('path');
const stat = util.promisify(fs.stat);
const access = util.promisify(fs.access);
const bagpipe = new Bagpipe(7);
const crypto = require('crypto');
const normalize = path.normalize;
const join = path.join;
const sep = path.sep;
const www = 'public';
const root = normalize(__dirname + sep + www + sep);

/*
 * These lines will attempt to read your subscription key from an environment
 * variable. If you prefer to hardcode the subscription key for ease of use,
 * replace process.env.SUBSCRIPTION_KEY with your subscription key as a string.
 */
//const subscriptionKey = 'e48db9d75ce94ad4bb2ac7e2814baf1b';//process.env.SUBSCRIPTION_KEY;
//const subscriptionKeys = ['e48db9d75ce94ad4bb2ac7e2814baf1b'];//westus test
//const subscriptionKeys = ['4c34eda7c3974544b34f5a6314e9e9f9', '06098a76119343c2acfc58c0733b13d4'];//westus
//const subscriptionKeys = ['7d9c971f039840a78c6abcaa6238f36c'];//eastasia
//const subscriptionKeys = ['520fe64290984004944fecf905bd69b0'];//southeastasia
const subscriptionKeys = [
//	{key: 'e48db9d75ce94ad4bb2ac7e2814baf1b', region: 'westus'},//美国西部
//	{key: '4c34eda7c3974544b34f5a6314e9e9f9', region: 'westus'},//美国西部
//	{key: 'a0702e243c8d4af498eea13ca3d48075', region: 'westus2'},//美国西部2
//	{key: '9874a9bd13d04336b9ffc47c3ba49d97', region: 'eastus'},//美国东部
//	{key: '73e15a97036c49b6bff7b13f5ad11b91', region: 'eastus2'},//美国东部2
//	{key: '7d9c971f039840a78c6abcaa6238f36c', region: 'eastasia'},//东亚
	{key: 'ca61b46813b24bc49722f23d9c0517f2', region: 'southeastasia'},//东南亚
//	{key: '9257a8f8d9054db18a247670a2fc54d0', region: 'northeurope'},//北欧
//	{key: '24d126d4fa0842eebe08ce6b9f6e31b9', region: 'westeurope'},//西欧
];
//if (!subscriptionKey) {
if (subscriptionKeys.length < 1) {
  throw new Error('Environment variable for your subscription key is not set.')
};

var textToSpeech = function(text, name, role, style, rate, pitch, volume, contour, lang, format, stream, count, callback) {
	//This is the callback to our saveAudio function.
    // It takes a single argument, which is the returned accessToken.
//	console.log(text + ' start');
    saveAudio(text, name, role, style, rate, pitch, volume, contour, lang, format, stream, count, callback);
}

//var accessToken = '';
var accessTokens = [];
//var region = 'westus';//美国西部
//var region = 'westus2';//美国西部2
//var region = 'eastus';//美国东部
//var region = 'eastus2';//美国东部2
//var region = 'eastasia';//东亚
//var region = 'southeastasia';//东南亚
//var region = 'northeurope';//北欧
//var region = 'westeurope';//西欧

var getToken = function(subscriptionKey, region, callback) {
	let options = {
        method: 'POST',
        uri: 'https://' + region + '.api.cognitive.microsoft.com/sts/v1.0/issueToken',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    };
    // This function retrieve the access token and is passed as callback
    // to request below.
    request(options, function(error, response, body) {
    //  console.log("Getting your token...")
        console.log("accessToken = " + body)
        if (!error && response.statusCode == 200) {
//        	accessToken = body;
        	callback(body)
        } else {
//        	throw new Error(error);
    		console.log('error1: ' + error);
        }
    })
};

var getTokens = function() {
	for(let i = 0; i < subscriptionKeys.length; i++) {
		getToken(subscriptionKeys[i].key, subscriptionKeys[i].region, function(accessToken) {
			accessTokens[i] = {token: accessToken, region: subscriptionKeys[i].region};
		});
	}
}

setInterval(() => {
	getTokens();
}, 14 * 60000);

getTokens();

var numb = 0;

var getAccessTokens = function() {
	let n = numb % accessTokens.length;
	numb++;
	return accessTokens[n];
}

//Make sure to update User-Agent with the name of your resource.
//You can also change the voice and output formats. See:
//https://docs.microsoft.com/azure/cognitive-services/speech-service/language-support#text-to-speech
//http://voice.qhkly.com:20080/?text=%E5%8F%AF%E4%BB%A5%E5%95%8A%EF%BC%8C%E4%BD%A0%E6%98%AF%E6%80%8E%E4%B9%88%E6%83%B3%E7%9A%84
/**
 * name 发音者
 * role 扮演
 * style 风格
 * rate 语速
 * pitch 音高
 * volume 音量
 * contour 音调
 * lang 语言
 */
var saveAudio = async function(text, name, role, style, rate, pitch, volume, contour, lang, format, stream, count, callback) {
 let time = (new Date()).getTime();
 let md5 = crypto.createHash('md5');
 if(name === undefined) {
     name = 'zh-CN-XiaoxiaoNeural';//发音者
 }
 if(role === undefined) {
     role = 'Default';//扮演
 }
 if(style === undefined) {
     style = 'Default';//风格calm平静
 }
 if(rate === undefined) {
     rate = '0';//语速
 }
 if(pitch === undefined) {
     pitch = '0';//音高
 }
 if(volume === undefined) {
     volume = '0';//音量
 }
 if(contour === undefined) {
     contour = '';//音调
 }
 if(lang === undefined) {
     lang = 'zh-CN';//语言
 }
 if(format === undefined) {
     format = 'riff-24khz-16bit-mono-pcm';
 }
 console.log('lang', lang);
 let key = text + '_' + name + '_' + role + '_' + style + '_' + rate + '_' + pitch + '_' + volume + '_' + contour + '_' + lang+ '_' + format;
 console.log('key', key);
 let result = md5.update(key).digest('hex');
 let filePath = __dirname + path.sep + 'wav' + path.sep + result + '.wav';
 try {
     //await access(filePath, fs.constants.F_OK);
     let stats = await stat(filePath);
     //console.log('stats.isFile()', stats.isFile());
     if(stats.isFile()) {
        let readStream = fs.createReadStream(filePath);
        readStream.pipe(stream).on('finish', callback);
        console.log('have', text);
     }
 } catch(e) {//zh-CN-XiaomoNeural zh-CN-XiaoxiaoNeural
    console.log('not have', text);
    let accessToken = getAccessTokens();
    //  let speak_body = '<speak version=\'1.0\' xmlns="http://www.w3.org/2001/10/synthesis" xml:lang=\'zh-CN\'>\n<voice  name=\'Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)\'>' + text + '</voice> </speak>';
    let speak_body = '<speak version=\'1.0\' xmlns=\'http://www.w3.org/2001/10/synthesis\' xmlns:mstts=\'https://www.w3.org/2001/mstts\' xml:lang=\'' + lang + '\'>\n\
            <voice name=\'' + name + '\'>\
            <mstts:express-as role=\'' + role + '\' style=\'' + style+ '\'>\
            <prosody rate=\'+' + rate + '.00%\' pitch=\'+' + pitch + '.00%\' volume=\'+' + volume + '.00%\' contour=\'' + contour + '\' >\
            ' + text + '\
            </prosody>\
            </mstts:express-as>\
            </voice>\
            </speak>';
    // console.log(speak_body);
    let options = {
        method: 'POST',
        baseUrl: 'https://' + accessToken.region + '.tts.speech.microsoft.com/',
        url: 'cognitiveservices/v1',
        headers: {
            'Authorization': 'Bearer ' + accessToken.token,
            'cache-control': 'no-cache',
            'User-Agent': 'YOUR_RESOURCE_NAME',
            'X-Microsoft-OutputFormat': format,
            'Content-Type': 'application/ssml+xml'
        },
    //     body: '<speak version=\'1.0\' xmlns="http://www.w3.org/2001/10/synthesis" xml:lang=\'en-US\'>\n<voice  name=\'Microsoft Server Speech Text to Speech Voice (en-US, Jessa24kRUS)\'>' + text + '</voice> </speak>'
    //     body: '<speak version=\'1.0\' xmlns="http://www.w3.org/2001/10/synthesis" xml:lang=\'zh-CN\'>\n<voice  name=\'Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)\'>' + text + '</voice> </speak>'
    //     body: '<speak version=\'1.0\' xmlns="http://www.w3.org/2001/10/synthesis" xml:lang=\'zh-CN\'>\n<voice  name=\'Microsoft Server Speech Text to Speech Voice (zh-CN, KangkangRUS)\'>' + text + '</voice> </speak>'
    //     body: '<speak version=\'1.0\' xmlns="http://www.w3.org/2001/10/synthesis" xml:lang=\'zh-CN\'>\n<voice  name=\'Microsoft Server Speech Text to Speech Voice (zh-CN, YaoyaoRUS)\'>' + text + '</voice> </speak>'
        body: speak_body
    };
    // This function makes the request to convert speech to text.
    // The speech is returned as the response.

    // Pipe the response to file.
    let readStream = request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
    //		console.log("Converting text-to-speech. Please hold...");
    //		console.log(text + ' ok');
        } else {
    //		throw new Error(error);
            console.log(text + ' error2: ' + error);
    //		callback(error);
        }
    });
    let writeStream = fs.createWriteStream(filePath + '.' + time);// + '.wav'
    readStream.on('data', (chunk) => {
        writeStream.write(chunk);
        //console.log('chunk', chunk.length);
    });
    readStream.on('end', () => {
        //writeStream.end();
        console.log('end');
    });
    readStream.pipe(stream).on('finish', function() {
        setTimeout(function() {
            writeStream.end();
            fs.rename(filePath + '.' + time, filePath, (error) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log('ok');
                }
            });
        }, 100);
        callback();
    });
 }
}

//Prompts the user to input text.
//let text = readline.question('What would you like to convert to speech? ');
var get = function(n) {
	let text = '你好' + n;
	let filename = __dirname + '/test' + n + 'sample.wav';
	textToSpeech(text, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, fs.createWriteStream(filename), 0, function(){
		console.log('test ok ' + n);
	});
}

let start_server = true;
if(!start_server) {
	setTimeout(() => {
	//	for(let i = 0; i < 200; i++) {
	//		get(i);
	//	}
		let i = 0;
		setInterval(() => {
			get(i);
			i++;
		}, 3000/subscriptionKeys.length);
	}, 2500);
} else {
	let port = 80;
	http.createServer(function(req, res) {
        //console.log('req.url', req.url);
        var pathname = url.parse(req.url).pathname;
        var pathfile = normalize(join(root, pathname));
        // malicious path
        if ((pathfile + sep).substr(0, root.length) !== root) {
            console.error('malicious path "' + pathfile + '"');
            res.writeHead(403);
            res.end('malicious path "' + pathfile + '"\n');
            return;
        }
        if (path.extname(pathfile) == "") {
            if(pathfile.endsWith('\\')) {
                pathfile += "index.html";
            }
        }
        fs.stat(pathfile, function(stat_error, stat) {
            if (!stat_error && stat.isFile()) {
                switch (path.extname(pathfile)) {
                case ".html":
                    res.writeHead(200, {
                        "Content-Type" : "text/html",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    break;
                case ".js":
                    res.writeHead(200, {
                        "Content-Type" : "text/javascript",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    break;
                case ".json":
                    res.writeHead(200, {
                        "Content-Type" : "application/json",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache",
                        "Access-Control-Allow-Origin" : "*",
                        "Access-Control-Allow-Headers" : "Content-Type,Content-Length, Authorization, Accept,X-Requested-With",
                        "Access-Control-Allow-Methods" : "PUT,POST,GET,DELETE,OPTIONS",
                    });
                    break;
                case ".css":
                    res.writeHead(200, {
                        "Content-Type" : "text/css",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    break;
                case ".gif":
                    res.writeHead(200, {
                        "Content-Type" : "image/gif",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    break;
                case ".jpg":
                    res.writeHead(200, {
                        "Content-Type" : "image/jpeg",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    break;
                case ".png":
                    res.writeHead(200, {
                        "Content-Type" : "image/png",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    break;
                default:
                    res.writeHead(200, {
                        "Content-Type" : "application/octet-stream",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                }
                fs.readFile(pathfile, function(err, data) {
                    res.end(data);
                });
            } else {
                let arg = querystring.parse(url.parse(req.url).query);
                let text = arg.text;
                if(text !== undefined) {
                    let name = arg.name;
                    let role = arg.role;
                    let style = arg.style;
                    let rate = arg.rate;
                    let pitch = arg.pitch;
                    let volume = arg.volume;
                    let contour = arg.contour;
                    let lang = arg.lang;
                    let format = arg.format;
                    if(name === undefined) {
                        name = 'zh-CN-XiaoxiaoNeural';//发音者
                    }
                    if(role === undefined) {
                        role = 'Default';//扮演
                    }
                    if(style === undefined) {
                        style = 'Default';//风格calm平静
                    }
                    if(rate === undefined) {
                        rate = '0';//语速
                    }
                    if(pitch === undefined) {
                        pitch = '0';//音高
                    }
                    if(volume === undefined) {
                        volume = '0';//音量
                    }
                    if(contour === undefined) {
                        contour = '';//音调
                    }
                    if(lang === undefined) {
                        lang = 'zh-CN';//语言
                    }
                    if(format === undefined) {
                        format = 'riff-24khz-16bit-mono-pcm';
                    }
                    //Start the sample app.
                    if(pathname == '/download') {
                        let md5 = crypto.createHash('md5');
                        let key = text + '_' + name + '_' + role + '_' + style + '_' + rate + '_' + pitch + '_' + volume + '_' + contour + '_' + lang;
                        let result = md5.update(key).digest('hex');
                        res.writeHead(200, {
                            'Content-Type' : 'application/octet-stream',
                            'Content-Disposition': 'attachment; filename="' + result + '.mp3"'
                        });
                    } else {
                        res.writeHead(200, {
                            'Content-Type' : 'audio/wav'
                        });
                    }
        			// textToSpeech(text, fs.createWriteStream('sample2.wav'), 0);
        			// textToSpeech(text, res, 0, function(){
        			// 	console.log('send', text);
        			// });
                    bagpipe.push(textToSpeech, text, name, role, style, rate, pitch, volume, contour, lang, format, res, 0, function() {
                        console.log('send', text);
                    });
                } else {
                    // res.writeHead(200, {
                    //     'Content-Type' : 'text/plain'
                    // });
                    // res.end('error\n');
                    res.writeHead(404, {
                        "Content-Type" : "text/html",
                        "Cache-Control" : "no-store, no-cache, must-revalidate",
                        "Pragma" : "no-cache"
                    });
                    res.end("<h1>404 Not Found</h1>");
                }
            }
        });
	}).listen(port, '0.0.0.0');
	console.log('start ready ' + port);
}
