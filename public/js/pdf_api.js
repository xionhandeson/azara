const helper = require('./helper');
const product_pdf = require('./product_pdf');
const product_transaction_pdf = require('./product_transaction_pdf');

//Create connection
const sqlite3 = require('sqlite3').verbose();

// open database in memory
let db = new sqlite3.Database('./azara.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
});

module.exports = {
	download_product_pdf: function(api) {
		let sql = "";
		api.post('/download_product_pdf',(req, res) => {
			if (req.body.download_all != '' && req.body.download_all != undefined){
				sql = "SELECT * FROM Product order by code asc";
			} else {
			  sql = "SELECT * FROM Product where quantity > 0 order by code asc"
			}
			db.all(sql, (error, products) => {
				if(error) console.log(error);
				const stream = res.writeHead(200, {
					'Content-Type': 'application/pdf',
					'Content-Disposition': 'attachment; filename='+helper.created_date()+'_Azara_Stock.pdf'
				});
				product_pdf.buildPDF(
					products,
					(chunk) => stream.write(chunk),
					() => stream.end()
				);
			});
		});
	},
	download_product_transaction_pdf: function(api) {
		let sql = "select * from ProductTransaction WHERE product_id = ? order by (substr(created_date, 7, 4) || '-' || substr(created_date, 4, 2) || '-' || substr(created_date, 1, 2)) desc";
		let sql2 = "select * from product where id = ?";
		api.post('/download_product_transaction_pdf',(req, res) => {
			db.all(sql, [req.body.product_id], (error, product_transactions) => {
				db.get(sql2, [req.body.product_id], (error, product) => {
					if(error) console.log(error);
					const stream = res.writeHead(200, {
						'Content-Type': 'application/pdf',
						'Content-Disposition': 'attachment; filename='+helper.created_date()+'_Azara_Product_Detail_'+req.body.product_code+'.pdf'
					});

					product_transaction_pdf.buildPDF(
						product_transactions,
						product,
						(chunk) => stream.write(chunk),
						() => stream.end()
					);
				});
			});
		});
	}
};

