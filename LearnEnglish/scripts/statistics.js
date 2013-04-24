window.statistics = kendo.observable( {
	allWords:10,
	knownWords: 7
});
function initStatistics() {
	stormDb.Statistics.filter("it.UserName == this.usr", {usr:logininfo.UserName}).orderByDescending("it.Wrong").toArray(function(items) {
        
		var unknownWord = items.filter(function(item) {
			return item.Wrong > 0;
		});
        window.statistics.set('allWords',items.length);
        window.statistics.set('knownWords',unknownWord.length);
		stormDb.Connections.filter("it.id in this.connectionIds", {
			connectionIds:unknownWord.map(function(item) {
				return item.Connection;
			})
		})
		.toArray(function(connections) {
			var wordIds = connections.map(function(w) {
				return w.Source;
			});
			wordIds = wordIds.concat(connections.map(function(w) {
				return w.Target;
			}));
			stormDb.Words.filter("it.id in this.wordIds", {wordIds: wordIds})
			.toArray(function(words) {
				var wCache = {};
				words.forEach(function(item) {
					wCache[item.id] = item;
				});
				var data = [];
				unknownWord.forEach(function(item) {
					var con = connections.filter(function(c) {
						return c.id == item.Connection
					})[0];
					data.push({Attempt:item.Attempt, Wrong:item.Wrong, Connection:'', Source:wCache[con.Source].Text,Target:wCache[con.Target].Text});
				});
                    
				$("#statistics-listview").kendoMobileListView({
					dataSource: kendo.data.DataSource.create({data: data }),
					template: $("#statisticsListViewTemplate").html()
				});
			});
		});
	});
}