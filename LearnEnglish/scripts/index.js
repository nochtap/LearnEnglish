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
		// "mydatabase" is your data context
		// "factory" is a context factory method
		// "type" is your context type
		window.stormDb = mydatabase;
		app.navigate("#tabstrip-mainPage");
		//mydatabase.Words.toArray(function(items) {
		//	alert(items[0].Text);            
		//});
	}).fail(function(err) {
		alert('Connection failed.');
		console.error(err);
	});
}

function initWordLearnView() {
	window.wordLearnViewModel = kendo.observable({
		highScore:{value:0},
		words:{source:'', meening:'', usrData:'', invisibleGreat:true, invisibleFail:true}
	});
	kendo.bind($("#tabstrip-wordlearn"), wordLearnViewModel, kendo.mobile.ui);
	getWord();
}

function getWord() {
	stormDb.Connections.toArray(function(connections) {
		var idx = getRandom(0, connections.length - 1);
		var wordCon = connections[idx];
		stormDb.Words.filter("it.id in this.ids", {ids:[wordCon.Source,wordCon.Target]}).toArray(function(items) {
			console.log(JSON.stringify(items));
			var hunWord = items[0].Lang == 'hu' ? items[0] : items[1];
			var engWord = items[0].Lang == 'en' ? items[0] : items[1];
            wordLearnViewModel.words.set("source", hunWord.Text);
            wordLearnViewModel.words.set("meaning", engWord.Text);
            wordLearnViewModel.words.set("usrData", '');
            wordLearnViewModel.words.set("invisibleGreat", true);
            wordLearnViewModel.words.set("invisibleFail", true);
			$('#meaning').mask(engWord.Text.replace(/[^ ]/g, '*'));
            $('#meaning').focus();
            
		});
	});
}

function sethighScore(value) {
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
				console.log("!!new score: " + JSON.stringify(items));
			},
			error:function() {
				console.log(JSON.stringify(arguments));
				alert("Don't save high score");
			}
		});
	});
}

function checkWord() {
	if (wordLearnViewModel) {
		if (wordLearnViewModel.words.meaning == wordLearnViewModel.words.usrData) {
			wordLearnViewModel.words.set("invisibleGreat", false);
			sethighScore(3);
			setTimeout(function() {
				getWord();
			}, 2000);
		}
		else {
			wordLearnViewModel.words.set("invisibleFail", false);
			sethighScore(-5);
		}
	}
	console.log(JSON.stringify(wordLearnViewModel.words));
}

function getRandom(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

function navToHi(){
    app.navigate("highScores.html");
}