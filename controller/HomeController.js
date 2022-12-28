//Create connection
const sqlite3 = require('sqlite3').verbose();
const sql = require('../utils/SqlConstants');
const home_service = require('../services/HomeService');

// open database in memory
let db = new sqlite3.Database('./azara.db', (err) => {
  if (err) {
    return console.error(err.message);
  } else {
		console.log('Connected to the in-memory SQlite database.');
		home_service.create_tables(db);
	}
});

module.exports = {
	load_homepage: function(api){
		api.get('/',(req, res) => {
			db.all(sql.PRODUCT_SELECT, (error, products) => {
				if(error) console.log(error);
				res.render('main',{
					products: products
				});
			});
		});
	}
}
