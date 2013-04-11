$data.define("LoginInfo", {
	UserName:String,
	Password:String
});
this.LoginInfo.setStore('default', {
	provider: 'local',
	collectionName:'LoginInfoItems'
});

function getLoginInfo() {
	var promise = new $.Deferred();
	$data("LoginInfo").readAll().then(function(item) {
		console.log(item)
	});
	$data("LoginInfo").readAll()
	.then(function(items) {
		if (items && items.length > 0) {
			promise.resolve(items[0]);    
		}
		else {
			$data("LoginInfo")
			.save({UserName:"", Password:""})
			.then(function(item) {
				console.log("Create new user");
				promise.resolve(item);
			})
			.fail(function() {
				alert("Local store error");
			});
		}
	})
	.fail(function() {
        alert("Local store error");
	});
	return promise;
}