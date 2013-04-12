function initStatistics() {
	stormDb.Statistics.filter("it.UserName == this.usr",{usr:logininfo.UserName}).orderByDescending("it.Wrong").toArray(function(items) {
		$("#statistics-listview").kendoMobileListView({
		dataSource: kendo.data.DataSource.create({data: items }),
		template: $("#statisticsListViewTemplate").html()
		});
	});
}