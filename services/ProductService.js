const sql = require('../utils/SqlConstants');
const { dialog } = require("electron");

function get_product_by_code(data, res, req, db) {
	db.serialize(() => {
		db.get(sql.PRODUCT_SEARCH_BY_CODE, data, (error, row) => {
			if(error || row == undefined) {
				dialog.showErrorBox("Error", "Product does not exist")
				res.redirect('/');
				return;
			}
			let total_quantity_in = 0;
			let total_quantity_out = 0;

			db.all(sql.PRODUCT_TRANSACTION_SELECT, [row.id], (error, rows) => {
				rows.forEach((row) => {
					total_quantity_in += parseInt(row.quantity_in);
					total_quantity_out += parseInt(row.quantity_out);
				});
				if(error || rows == undefined) {
					dialog.showErrorBox("Error", "Product does not exist")
					res.redirect('/');
					return;
				}
				res.render('product_view',{
					row: row,
					rows: rows,
					total_quantity_in: total_quantity_in,
					total_quantity_out: total_quantity_out
				});
			});
		});
	});
}

function get_multiple_product_by_code(data, res, req, db) {
	let sql = "SELECT * FROM Product WHERE code in ("+ data +") order by code asc";
	let products = []
	db.each(sql, [], (error, product) => {
		if(error || product == undefined) {
			dialog.showErrorBox("Error", "One of the product does not exist")
			res.redirect('/');
			return;
		}
		products.push(product)
	});
	res.render('main',{
		products: products
	});
}

module.exports = { get_product_by_code, get_multiple_product_by_code }