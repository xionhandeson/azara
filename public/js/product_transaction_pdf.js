// Importing modules
PDFDocument = require('pdfkit-table');
fs = require('fs');

// Create a document
function buildPDF(product_transactions, product, dataCallback, endCallback) {
  const doc = new PDFDocument();
	doc.on('data', dataCallback);
	doc.on('end', endCallback);

	product_transaction_array = [];
	filtered_product_transaction_array = [];
	total_quantity_in = 0;
	total_quantity_out = 0;
	product_transactions.forEach((product_transaction) => {
		product_transaction_array.push(product_transaction.quantity_in, product_transaction.quantity_out, product_transaction.description.replace('\r\n', ""), product_transaction.created_date);
		total_quantity_in += parseInt(product_transaction.quantity_in);
		total_quantity_out += parseInt(product_transaction.quantity_out);
	});
	while(product_transaction_array.length) {
		filtered_product_transaction_array.push(product_transaction_array.splice(0,4))
  }

	console.log(filtered_product_transaction_array);

  const table01 = {
		"headers" : ["Quantity In", "Quantity Out", "Description", "Added Date"],
		"rows": filtered_product_transaction_array
	 };

	 doc.fontSize(25).text("Code:" + product.code);
	 doc.fontSize(25).text("STOCK BALANCE:" + product.quantity);
	 doc.fontSize(25).text("TOTAL IN:" + total_quantity_in);
	 doc.fontSize(25).text("TOTAL OUT:" + total_quantity_out);

	 doc.table(table01, {
		 columnSpacing: 5,
		 padding: 5,
		 columnsSize: [100, 100, 200, 100],
		 prepareHeader: () => doc.fontSize(14), // {Function}
		 prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {

			 const {x, y, width, height} = rectCell;
			 if(indexColumn === 0){
				 doc
				 .lineWidth(.5)
				 .moveTo(x, y)
				 .lineTo(x, y + height)
				 .stroke();
			 }

			 doc
			 .lineWidth(.5)
			 .moveTo(x + width, y)
			 .lineTo(x + width, y + height)
			 .stroke();


			 doc.fontSize(16).fillColor('#292929');

		 },
	 });

	 doc.end();
}

module.exports = { buildPDF };
