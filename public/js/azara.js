$(document).ready(function() {
  $('#addProductModal').on('shown.bs.modal', function() {
    $('#addProductInput').trigger('focus');
  });
});

$(document).ready(function() {
  $('#searchProductModal').on('shown.bs.modal', function() {
    $('#searchProductInput').trigger('focus');
  });
});

$(document).ready(function() {
  $('#QuantityInModal').on('shown.bs.modal', function() {
    $('#quantity_in').trigger('focus');
  });
});

$(document).ready(function() {
  $('#QuantityOutModal').on('shown.bs.modal', function() {
    $('#quantity_out').trigger('focus');
  });
});

var now = new Date();
var date = ("0" + now.getDate()).slice(-2) + "-" + ("0"+(now.getMonth()+1)).slice(-2) + "-" + now.getFullYear();
document.getElementById("created_date").value = date;
document.getElementById("stock_out_date").value = date;