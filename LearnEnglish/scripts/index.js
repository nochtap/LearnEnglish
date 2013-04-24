document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	initLocalStore();
}

function initLocalStore() {
	getLoginInfo()
	.then(function(info) {
		window.logininfo = kendo.observable({UserName:info.UserName, Password:info.Password});
		window.info = info;
		kendo.bind($("#tabstrip-login"), logininfo, kendo.mobile.ui);
	});
}

function login() {
	app.showLoading();
	try {
		info.UserName = logininfo.UserName;
		info.Password = logininfo.Password;
		info.save()
		.then(function(savedItem) {
			console.log("Save login info");
			initStorm(savedItem.UserName, savedItem.Password);
		})
		.fail(function() {
			console.log("Save data error");
		});
	}
	catch (e) {
		alert("hiba", e);
	}
}

function reset() {
	try {
		$data("LoginInfo").removeAll().then(function() {
			initLocalStore();
		});
	}
	catch (e) {
		alert("hiba:" + JSON.stringify(e));
	}
}

function initStorm(usr, psw) {
	window.apiKey = {
		ownerId: '433c78e4-1ca3-4a61-ad8b-2a1ac1fa5b04',
		appId: '02f440e6-8cd1-44a1-ae2d-44586e9c7a1c',
		serviceName: 'mydatabase'
	};
	window.credentials = {user:usr, password:psw};
	console.log("LOGIN INFO");
	console.log(JSON.stringify(credentials));
	$data.initService(apiKey, credentials).then(function(mydatabase, factory, type) {
		window.stormDb = mydatabase;
		$('#tabStrip').show();
		app.navigate("gameSelector.html");
	}).fail(function(err) {
		alert('Connection failed.');
		console.error(err);
	});
}

function initWordLearnView() {
	$('#tabStrip').hide();
	window.wordLearnViewModel = kendo.observable({
		highScore:{value:0},
		words:{source:'', meening:'', usrData:'', hint:'', invisibleGreat:true, invisibleFail:true, help:false, connectionId:'', prevConnectionId:''},
		settings:{
			newWord:true,
			unknownWord:true,
			known:true,
			wordType:['word', 'preposition', 'phrase', 'verb', 'noun', 'adjective']
		}
	});
	kendo.bind($("#tabstrip-wordlearn"), wordLearnViewModel, kendo.mobile.ui);
	getWord();
}
function closeModalViewSetting () {
	$("#modalview-setting").kendoMobileModalView("close");
}
function getWord() {
	stormDb.Connections.toArray(function(connections) {
		stormDb.Statistics.filter('it.UserName == this.usr', {usr:logininfo.UserName}).toArray(function(statistics) {
			var rndTable = [];
			var maxNum = 0;
			var knowWord = 0;
			var connectionCnt = connections.length;
			var maxAttempt = statistics.reduce(function(prevValue, currentValue) {
				return prevValue + currentValue.Attempt
			}, 0);
			var avgAttempt = Math.round(maxAttempt / connectionCnt);
			console.log("-= STAT maxAtempt: ", maxAttempt, 'conCnt: ', connectionCnt, "avgAttempt: ", avgAttempt);
			connections.forEach(function(connection) {
				var stat = null;
				var idx = 0;
				while (stat == null && idx < statistics.length) {
					stat = statistics[idx].Connection == connection.id?statistics[idx]:null;
					idx++;
				}
				if (stat == null) {
					stat = {Attempt:1, Wrong:1};
				}
				var connectionStat = Math.round((stat.Wrong / stat.Attempt) * connectionCnt);
				if (stat.Attempt <= 3 && connectionStat < connectionCnt) {
					connectionStat = connectionCnt;
				}
				if (connectionStat == 0) {
					connectionStat = Math.round(avgAttempt * (avgAttempt / stat.Attempt));
					knowWord+=1;
				}
				else {
					connectionStat += avgAttempt;
				}
				rndTable.push({connectionId:connection.id, stat:connectionStat, min:maxNum, max:maxNum + connectionStat - 1, attempt:stat.Attempt});
				maxNum += connectionStat;
			});
			//console.log(rndTable);
			//console.log(maxNum, connectionCnt);
			var progressBar = $("#progressbar").progressbar({
				value: Math.round((knowWord / connectionCnt) * 100)
			});
			if (!$("#progressbar .caption").get(0)) {
				progressBar.append("<div class='caption'>" + Math.round((knowWord / connectionCnt) * 100) + "%</div>");
			}
			else {
				$("#progressbar .caption").html(Math.round((knowWord / connectionCnt) * 100) + "%");
			}
            
			var wordCon = null;
			while (wordCon == null || (wordCon != null && wordCon.id == wordLearnViewModel.words.prevConnectionId)) {
				var idx = -1;
				var rndNum = getRandom(0, maxNum - 1);
				var i = 0;
				console.log("Random unmber: ", rndNum);
				while (idx < 0 && i < rndTable.length) {
					if (rndTable[i].min <= rndNum && rndTable[i].max >= rndNum) {
						idx = i;
					}
					i++;
				}
				if (idx < 0) {
					console.log("not found connection");
					idx = 0;
				}
				wordCon = connections[idx];
			}
			wordLearnViewModel.words.set("prevConnectionId", wordCon.id);
			stormDb.Words.filter("it.id in this.ids", {ids:[wordCon.Source,wordCon.Target]}).toArray(function(items) {
				console.log(JSON.stringify(items));
				var hunWord = items[0].Lang == 'hu' ? items[0] : items[1];
				var engWord = items[0].Lang == 'en' ? items[0] : items[1];
				wordLearnViewModel.words.set("connectionId", wordCon.id);
				wordLearnViewModel.words.set("source", hunWord.Text);
				wordLearnViewModel.words.set("meaning", engWord.Text);
				wordLearnViewModel.words.set("usrData", '');
				wordLearnViewModel.words.set("invisibleGreat", true);
				wordLearnViewModel.words.set("invisibleFail", true);
				wordLearnViewModel.words.set("help", false);
				wordLearnViewModel.words.set("hint", engWord.Text.replace(/[^ ]/g, '_'));
				$('#meaning').focus();
				$('#nextWord').hide();
				$('#checkWord').show();
			});
		});
	});
}

function sethighScore(value, id) {
	stormDb.HighScores.filter("it.UserName == this.usr", {usr:logininfo.UserName}).toArray(function(items) {
		var score = null;
		if (items && items.length > 0) {
			score = items[0];
			stormDb.HighScores.attach(score);
		}
		else {
			score = new stormDb.HighScores.createNew({UserName:logininfo.UserName, Score:0});
			stormDb.HighScores.add(score);
		}
		score.Score += value; 
		console.log(JSON.stringify(score));
		stormDb.saveChanges({
			success:function() {
				wordLearnViewModel.highScore.set("value", score.Score);
				setStatistics(value, id);
				console.log("!!new score: " + JSON.stringify(items));
			},
			error:function() {
				console.log(JSON.stringify(arguments));
				alert("Don't save high score");
			}
		});
	});
}

function setStatistics(value, id) {
	stormDb.Statistics.filter("it.UserName == this.usr && it.Connection == this.connectionId", {usr:logininfo.UserName, connectionId:id}).toArray(function(statistics) {
		var stat = null;
		if (statistics.length > 0) {
			stat = statistics[0];
			stormDb.Statistics.attach(stat);
			stat.Attempt = stat.Attempt + 1;
			if (value < 0) {
				stat.Wrong = stat.Wrong + 3;
			}
			else if (value == 3) {
				stat.Wrong = stat.Wrong - 1;
				if (stat.Wrong < 0) {
					stat.Wrong = 0;
				}
			}
			console.log("Stat update!!!");
		}
		else {
			stat = new stormDb.Statistics.createNew({UserName:logininfo.UserName,Connection:id, Attempt:1, Wrong:value < 0?3:0 });
			stormDb.Statistics.add(stat);
			console.log("Stat new!!!");
		}
		console.log("New stat: ", stat);
		stormDb.saveChanges();
	});
}

function checkWord() {
	$('#checkWord').hide();
	$('#nextWord').hide();
	if (wordLearnViewModel) {
		if (wordLearnViewModel.words.meaning == wordLearnViewModel.words.usrData) {
			wordLearnViewModel.words.set("invisibleGreat", false);
			wordLearnViewModel.words.set("hint", wordLearnViewModel.words.meaning);
			sethighScore(wordLearnViewModel.words.help?1:3, wordLearnViewModel.words.connectionId);
			setTimeout(function() {
				getWord();
			}, 2000);
		}
		else {
			$('#nextWord').show();
			wordLearnViewModel.words.set("invisibleFail", false);
			wordLearnViewModel.words.set("hint", wordLearnViewModel.words.meaning);
			sethighScore(-5, wordLearnViewModel.words.connectionId);
		}
	}
	console.log(JSON.stringify(wordLearnViewModel.words));
}

function getHelp() {
	var chrIndex = -1;
	var origHint = wordLearnViewModel.words.hint.split('');
	var spaceNum = origHint.reduce(function(prevValue, currentValue) {
		return currentValue == '_'?++prevValue:prevValue;
	}, 0);
	if (spaceNum / wordLearnViewModel.words.meaning.length <= 0.4) {
		return;
	}
    
	while (chrIndex < 0 || (chrIndex >= 0 && origHint[chrIndex] != '_')) {
		chrIndex = getRandom(0, wordLearnViewModel.words.meaning.length - 1);
	}
	origHint[chrIndex] = wordLearnViewModel.words.meaning[chrIndex];
	wordLearnViewModel.words.set("hint", origHint.join(''));
	wordLearnViewModel.words.set("help", true);
	$('#meaning').focus();
}

function getRandom(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

function navToHi() {
	app.navigate("highScores.html");
}