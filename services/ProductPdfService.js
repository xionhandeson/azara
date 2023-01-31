// Importing modules
PDFDocument = require('pdfkit-table');
fs = require('fs');

// Create a document
function buildPDF(products, dataCallback, endCallback) {
  const doc = new PDFDocument();
	doc.on('data', dataCallback);
	doc.on('end', endCallback);

	product_array = [];
	filtered_product_array = [];
	i = 1;
	total_quantity = 0;

	products.forEach((product) => {
		product_array.push(i, product.code, product.quantity, product.description.replace('\r\n', ""));
		total_quantity += parseInt(product.quantity);
		i++;
	});
	while(product_array.length) {
		filtered_product_array.push(product_array.splice(0,4))
  }

	doc.fontSize(25).text("GRAND TOTAL:" + total_quantity);

	console.log(filtered_product_array)

  const table01 = {
		"headers" : ["ID", "Code", "Stock Balance", "Description"],
		"rows": filtered_product_array
	 };
	 doc.table(table01, {
		 columnSpacing: 5,
		 padding: 5,
		 columnsSize: [25, 100, 100, 200],
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
