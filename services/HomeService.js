function create_tables(db) {
	let create_product_sql = 'CREATE TABLE IF NOT EXISTS "Product" ( "id" INTEGER NOT NULL UNIQUE, "code" TEXT NOT NULL UNIQUE, "quantity" INTEGER DEFAULT 0, "description" TEXT, "created_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "modified_date" TEXT, PRIMARY KEY("id") )'
	let create_product_transaction_sql = 'CREATE TABLE IF NOT EXISTS "ProductTransaction" ( "id" INTEGER NOT NULL, "product_id" INTEGER NOT NULL, "quantity_in" INTEGER DEFAULT 0, "quantity_out" INTEGER DEFAULT 0, "description" TEXT, "created_date" TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY("id" AUTOINCREMENT) )'

	db.run(create_product_sql,(err) => {
		db.run(create_product_transaction_sql,(err) => {
			if (err) {
				console.log(err)
			}
		});
	});
}

module.exports = { create_tables }