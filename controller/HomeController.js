//Create connection
const sql = require('../utils/SqlConstants');

module.exports = {
	load_homepage: function(app, api, db){
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
