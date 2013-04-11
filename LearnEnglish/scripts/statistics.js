function initStatistics() {
	stormDb.Statistics.orderByDescending("it.Wrong").toArray(function(items) {
		$("#highscore-listview").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({data: items }),
		template: $("#highscoreListViewTemplate").html()
		});
	});
}