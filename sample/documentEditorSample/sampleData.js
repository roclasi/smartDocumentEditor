/**
 * @properties={typeid:24,uuid:"456B4C6E-DFAC-4AAF-BFFD-762311EFBBF7"}
 */
function setupSampleData() {
	db_customer();
	db_employee();
}

/**
 * @protected 
 * @properties={typeid:24,uuid:"505090B3-4879-40C1-A334-BD939A6C95F1"}
 */
function db_customer() {
	var fs = datasources.mem.customer.getFoundSet();
	fs.loadAllRecords();
	fs.deleteAllRecords();
	
	var rec = fs.getRecord(fs.newRecord());
	rec.first_name = 'Sean';
	rec.last_name = 'Devlin';
	rec.company = 'Servoy B.V.';
	rec.address = 'Fred. Roeskestraat 97c';
	rec.phone = '+31 33 455 9877';
	databaseManager.saveData(rec);
}

/**
 * @properties={typeid:24,uuid:"16D8F55A-CB41-40F6-B5DD-36C93356848D"}
 */
function db_employee() {
	var fs = datasources.mem.employee.getFoundSet();
	fs.loadAllRecords();
	fs.deleteAllRecords();
	
	var fsCust = datasources.mem.customer.getFoundSet();
	fsCust.loadAllRecords();
	var recCust = fsCust.getRecord(1);
	
	/**@type {Array<{name: String, country: String, email: String, phone: String}>} */
	var sampleData = JSON.parse(solutionModel.getMedia('employee_sampledata.json').getAsString());
	sampleData.forEach(function(item) {
		var rec = recCust.customer_to_employee.getRecord(recCust.customer_to_employee.newRecord());
		rec.firstname = item.name.split(' ')[0];
		rec.lastname = item.name.split(' ')[1];
		rec.country = item.country;
		rec.email = item.email;
		rec.phone = item.phone;
		rec.date_of_birth = item.date;
		databaseManager.saveData(rec);
	});
	
}