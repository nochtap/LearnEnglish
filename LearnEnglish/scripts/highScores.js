function initHighScore(usr, psw) {
    console.log("k");
	stormDb.HighScores.orderByDescending("it.Score").toArray(function(items) {
		$("#highscore-listview").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({data: items }),
		template: $("#highscoreListViewTemplate").html()
		});
	});
}