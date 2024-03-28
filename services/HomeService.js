async function runSql(db, sql, errorMessage) {
	try {
			await db.run(sql);
	} catch (err) {
			console.error(errorMessage, err);
			throw err;
	}
}
async function create_tables(db) {
	// SQL commands
	const create_product_sql = `
			CREATE TABLE IF NOT EXISTS "Product" (
							"id" INTEGER NOT NULL UNIQUE,
							"code" TEXT NOT NULL UNIQUE,
							"quantity" INTEGER DEFAULT 0,
							"description" TEXT,
							"created_date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
							"modified_date" TEXT,
							PRIMARY KEY("id")
			)
	`;
	const create_product_transaction_sql = `
			CREATE TABLE IF NOT EXISTS "ProductTransaction" (
							"id" INTEGER NOT NULL,
							"product_id" INTEGER NOT NULL,
							"quantity_in" INTEGER DEFAULT 0,
							"quantity_out" INTEGER DEFAULT 0,
							"description" TEXT,
							"created_date" TEXT DEFAULT CURRENT_TIMESTAMP,
							PRIMARY KEY("id" AUTOINCREMENT)
			)
	`;
	const update_product_sql = `
			ALTER TABLE "Product"
			ADD COLUMN "warehouse_code" TEXT
	`;

	// Create tables
	await runSql(db, create_product_sql, 'Error creating Product table:');
	await runSql(db, create_product_transaction_sql, 'Error creating ProductTransaction table:');

	// Check if 'warehouse_code' column exists
	try {
		const [columns, indices] = await Promise.all([
				new Promise((resolve, reject) => {
						const existingColumns = [];
						db.each("PRAGMA table_info('Product')", (err, row) => {
								if (err) {
										reject(err);
										return;
								}
								existingColumns.push(row.name);
						}, () => resolve(existingColumns));
				}),
				new Promise((resolve, reject) => {
						db.all("PRAGMA index_list('Product')", [], (err, rows) => {
								if (err) {
										reject(err);
										return;
								}
								resolve(rows);
						});
				})
		]);

		// Check if 'warehouse_code' column exists
		if (!columns.includes('warehouse_code')) {
				await runSql(db, update_product_sql, 'Error updating Product table:');
		}

		// Check if 'code' column has a unique constraint
		let uniqueConstraintFound = false;
		await Promise.all(indices
				.filter(index => index.origin === 'u')
				.map(index => new Promise((resolve, reject) => {
						db.get(`PRAGMA index_info(${index.name})`, [], (err, indexRow) => {
								if (err) {
										reject(err);
										return;
								}
								if (indexRow && indexRow.name === "code") {
										uniqueConstraintFound = true;
								}
								resolve();
						});
				}))
		);

		if (uniqueConstraintFound) {
				update_product_table(db);
		} else {
				console.log("Column 'code' doesn't have a unique constraint");
		}
	} catch (err) {
		console.error('Error updating database or checking for unique constraint on "code" column:', err);
	}
}
async function update_product_table(db) {
	db.serialize(() => {
  // Start a transaction
  db.run('BEGIN TRANSACTION;');

  // Step 1: Create a temporary table with the desired schema
  db.run(`
    CREATE TABLE Product_temp (
      id INTEGER NOT NULL UNIQUE,
      code TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      description TEXT,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      modified_date TEXT,
			warehouse_code TEXT,
      PRIMARY KEY(id)
    );
  `);

  // Step 2: Copy data from the original table to the temporary table
  db.run(`
    INSERT INTO Product_temp (id, code, quantity, description, created_date, modified_date, warehouse_code)
    SELECT id, code, quantity, description, created_date, modified_date, warehouse_code
    FROM Product;
  `);

  // Step 3: Drop the original table
  db.run('DROP TABLE IF EXISTS Product;');

  // Step 4: Rename the temporary table to the original table name
  db.run('ALTER TABLE Product_temp RENAME TO Product;');

  // Commit the transaction
  db.run('COMMIT;', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Transaction committed.');
  });
});
}

module.exports = { create_tables, update_product_table }
