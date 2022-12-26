module.exports = {
  created_date: function(){
		let now = new Date();
		let date = ("0" + now.getDate()).slice(-2) + "-" + ("0"+(now.getMonth()+1)).slice(-2) + "-" + now.getFullYear();
		return date;
	},
};