/**
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"4D361EB8-C458-491F-AFD0-1B539C6DC8BA",variableType:4}
 */
var showInfoBox = 1;

/**
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"EE321E24-9AD8-4D76-8C40-E03668188648",variableType:4}
 */
var hideDOB = 0;

/**
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"1400F609-B7C5-430F-A018-96329D976374",variableType:4}
 */
var hideEmployeeRepeat = 0;

/**
 * @type {String}
 *
 * @properties={typeid:35,uuid:"F96F04E2-C58B-4B0B-B8C9-714C901C4FD8"}
 */
var CKDATA = null;

/**
 *
 * @type {scopes.svyDocEditor.DocumentEditor}
 *
 * @properties={typeid:35,uuid:"BDF96512-3E1A-48AE-AECB-1545E4F722A5",variableType:-4}
 */
var EDITOR_INSTANCE;

/**
 * @properties={typeid:35,uuid:"A75DEC41-CDEE-456B-B794-316209B805C7",variableType:-4}
 */
var TAG_FIELDS = {
	CUSTOMERS: {
		DATASOURCE: datasources.mem.customer.getDataSource(),
		FIELDS: [
			{ DB_TITLE: 'CURRENT_TIME', FIELD: 'custom_now', FORMAT: 'dd-MM-yyyy', IGNORE_VALIDATE: true},
			{ DB_TITLE: 'First-Name', FIELD: 'first_name' }, 
			{ DB_TITLE: 'Last-Name', FIELD: 'last_name' },
			{ DB_TITLE: 'Phone', FIELD: 'phone' },
			{ DB_TITLE: 'Company_name', FIELD: 'company' },
			{ DB_TITLE: 'Address', FIELD: 'address' },
			{ DB_TITLE: 'First-Name', FIELD: 'firstname', RELATION: 'customer_to_employee', ONE_TO_ONE: false},
			{ DB_TITLE: 'Last-Name', FIELD: 'lastname', RELATION: 'customer_to_employee', ONE_TO_ONE: false},
			{ DB_TITLE: 'Date-of-birth', FIELD: 'date_of_birth', RELATION: 'customer_to_employee', ONE_TO_ONE: false, FORMAT: 'dd-MM-yyyy'}
		]
	}
}

/**
 * @properties={typeid:35,uuid:"C01879B9-6A3A-4BCB-9D5B-F027A1D8D554",variableType:-4}
 */
var IF_TAGS = [
	{ displayValue: 'show-info-box', realValue: 'example' }
];

/**
 * @param {JSEvent} event
 * @param {Boolean} firstShow
 *
 * @properties={typeid:24,uuid:"96420519-66AB-47D3-A4B2-B044EC8EF9EF"}
 * @AllowToRunInFind
 */
function onShow(event, firstShow) {
	CKDATA = solutionModel.getMedia('sample2.html').getAsString();
	setupEditor(event);
}

/**
 * @param {JSEvent} event
 *
 * @private
 *
 * @properties={typeid:24,uuid:"9F862B38-2D39-4BB6-A16E-70FCB623683B"}
 */
function setupEditor(event) {
	EDITOR_INSTANCE = scopes.svyDocEditor.getInstance(elements.documenteditor);

	var tagBuilder = EDITOR_INSTANCE.tagBuilder(TAG_FIELDS.CUSTOMERS.DATASOURCE)
	TAG_FIELDS.CUSTOMERS.FIELDS.forEach(/**@param {{DB_TITLE: String, FIELD_TITLE: String, FIELD: String, RELATION: String, ONE_TO_ONE: Boolean, FORMAT: String, IGNORE_VALIDATE: Boolean}} tagField */ function(tagField) {
		var dataProvider = tagField.RELATION ? tagField.RELATION + '.' + tagField.FIELD : tagField.FIELD;
		var dataProviderInfo = scopes.svyDataUtils.getDataProviderJSColumn(TAG_FIELDS.CUSTOMERS.DATASOURCE, dataProvider);
		var dbTitle;
		if (tagField.DB_TITLE && tagField.DB_TITLE.startsWith('i18n:')) {
			dbTitle = i18n.getI18NMessage(tagField.DB_TITLE);
		} else {
			dbTitle = tagField.DB_TITLE;
		}

		var fieldTitle;
		if (tagField.FIELD_TITLE && tagField.FIELD_TITLE.startsWith('i18n:')) {
			fieldTitle = i18n.getI18NMessage(tagField.FIELD_TITLE);
		} else if (dataProviderInfo) {
			fieldTitle = dataProviderInfo.getTable().getDataSource().split(':').pop();
		} else {
			fieldTitle = tagField.DB_TITLE;
		}
		var displayTag = (dbTitle ? [dbTitle, fieldTitle].join(': ') : fieldTitle);

		tagBuilder.addField(dataProvider, displayTag, !tagField.ONE_TO_ONE, tagField.FORMAT, tagField.IGNORE_VALIDATE);
	})

	if (IF_TAGS && IF_TAGS.length > 0) {
		IF_TAGS.forEach(/**@param {{displayValue: String, realValue: String}} item */function(item) {
			tagBuilder.addIfTag(item.realValue, item.displayValue);
		});
	}

	tagBuilder.build();

	var toolbarConfig = {
		"toolbar": {
			items: ['previousPage',
			'nextPage',
			'pageNavigation',
			'|',
			'heading',
			'simpleBox',
			'|',
			'fontfamily',
			'fontsize',
			'fontColor',
			'fontBackgroundColor',
			'|',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'code',
			'subscript',
			'superscript',
			'highlight',
			'|',
			'alignment',
			'|',
			'indent',
			'outdent',
			'|',
			'link',
			'pageBreak',
			'horizontalline',
			'blockquote',
			'imageUpload',
			'insertTable',
			'mediaEmbed',
			'specialCharacters',
			'|',
			'undo',
			'redo'],
			shouldNotGroupWhenFull: true,
			svyToolbarItems: []
		}
	};

	EDITOR_INSTANCE.getElement().create(toolbarConfig);
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"58AD06FA-06CF-435B-A8AB-E20DFBD0F0C7"}
 */
function setVisible(event) {
	elements.documenteditor.visible = !elements.documenteditor.visible;
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"472CE5CD-E931-4073-BB67-E877FFE90075"}
 */
function onFocusGained(event) {
	application.output('onFocusGained: ' + event.getType() + ' form: ' + event.getFormName() + ' elm: ' + event.getElementName());
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"A1250848-31C2-488D-92AD-999D68C625D4"}
 */
function onFocusLost(event) {
	application.output('onFocusLost: ' + event.getType() + ' form: ' + event.getFormName() + ' elm: ' + event.getElementName());
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"A970EAC7-C095-44B4-8BEE-34AA32F72467"}
 */
function toggleToolbar(event) {
	elements.documenteditor.showToolbar = !elements.documenteditor.showToolbar;
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"E30BFB0E-9FA1-41EA-84B3-1AA507A654FC"}
 */
function onAction(event) {
	application.output('onAction: ' + event.getType() + ' form: ' + event.getFormName() + ' elm: ' + event.getElementName());

}

/**
 * @param {JSEvent} event
 *
 * @private
 *
 * @properties={typeid:24,uuid:"98145AA0-C1C9-4CAE-9013-5BE6A8971F60"}
 */
function getCSS(event) {
	application.output(elements.documenteditor.getCSSData('youCantFindMe'));

}

/**
 * @param {JSEvent} event
 *
 * @private
 *
 * @properties={typeid:24,uuid:"C5F7EAF1-8FF2-4A86-8937-7B484B0D102F"}
 */
function getData(event) {
	application.output(elements.documenteditor.getHTMLData());

}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"3BB3EEAC-B958-4E3B-93E9-26ABE5818636"}
 */
function getDataInline(event) {
	application.output(elements.documenteditor.getHTMLData(true, 'youCantFindMe'));

}

/**
 * @param {JSEvent} event
 *
 * @private
 *
 * @properties={typeid:24,uuid:"60C05E3C-15C7-4001-90D5-B87D2A894C00"}
 */
function htmlToText(event) {
	var text = elements.documenteditor.getHTMLData(true, 'youCantFindMe');
	application.output(scopes.svyDocEditor.HtmlToText(text));
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"DD95DBF0-B853-4380-90BE-1FD066093DFF"}
 */
function printPDFAsync(event) {
	var record;
	var html = '';
	record = foundset.getSelectedRecord();
	if (record) {
		var useInstance = scopes.svyDocEditor.getInstance(elements.documenteditor);
		html = useInstance.mergeTags(record, true, 'youCantFindMe');
	}
	var documentExporter = scopes.svyDocEditor.getExporter();

	documentExporter.setContent(html);
	documentExporter.addHeadTag('<meta charset="UTF-8">');
	documentExporter.addHeadTag('<link rel="preconnect" href="https://fonts.googleapis.com">');
	documentExporter.addHeadTag('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
	documentExporter.addHeadTag('<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">');

	documentExporter.exportToPDFAsync(asyncSuccess, null, ['test', true]);
}

/**
 * @param {Array<byte>} pdf
 *
 * @properties={typeid:24,uuid:"E578A790-D962-4BE3-A854-4C56DF341F9E"}
 */
function asyncSuccess(pdf) {
	if (pdf) {
		plugins.file.writeFile('sample.pdf', pdf);
	}
}

/**
 * @protected
 * @param {Boolean} inlineCSS
 * @return {String}
 * @properties={typeid:24,uuid:"E09E4416-90E8-4B38-AC41-80FF633F23BD"}
 */
function mergeTags(inlineCSS) {
	return EDITOR_INSTANCE.mergeTags(foundset.getSelectedRecord(), inlineCSS, 'youCantFindMe', ifParser, mentionOverwrite, repeatOverwrite);
}
/**
 * @properties={typeid:24,uuid:"E608CD06-29C9-489E-9117-4367DA218386"}
 */
function switchToPreviewMode() {
	if (!EDITOR_INSTANCE.getElement().isInPreviewMode()) {
		var html = mergeTags(false);
		EDITOR_INSTANCE.getElement().previewHTML(html);
	} else {
		// Switch to non-preview mode
		EDITOR_INSTANCE.getElement().undoPreviewHTML();
	}
}

/**
 * @return {*}
 * @properties={typeid:24,uuid:"EBD25532-A67E-4FAA-B835-5CB811966B93"}
 */
function mentionOverwrite(mentionRealvalue, mentionDisplayValue, dataprovider, relationName, record) {
	application.output(arguments)
	application.output("Document mentionCallback - dataprovider: `" + dataprovider + "` relationName: `" + relationName + "` record: `" + record + "` mentionRealValue: `" + mentionRealvalue + "`");
	switch (mentionRealvalue) {
		case 'custom_now':
			return new Date();
		case 'customer_to_employee.date_of_birth':
			var age = scopes.svyDateUtils.getYearDifference(record[dataprovider], new Date());
			return !hideDOB || age >= 18 ? record[dataprovider] : null;
		default:
			return record[dataprovider];
	}
	
}

/**
 * @param mentionRealValue
 * @param relationName
 * @param {JSRecord} record
 *
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"E43B77A0-517C-4C4A-94A7-934DDA6C9D18"}
 */
function repeatOverwrite(mentionRealValue, relationName, record) {
	application.output('Document repeatCallback - realValue: `' + mentionRealValue + '` relationName: `' + relationName + '` record: `' + record + '`');
	if(mentionRealValue == 'customer_to_employee'){
		return !hideEmployeeRepeat;
	}
	return true;
}

/**
 * @protected
 * @param realValue
 * @param {JSRecord<mem:employee>} record
 * @return {Boolean}
 * @properties={typeid:24,uuid:"51D85D56-9E95-437D-8280-026E618BA200"}
 */
function ifParser(realValue, record) {
	application.output('Document Ifparser - realValue: `' + realValue + '` record: `' + record + '`');
	switch (realValue) {
		case 'example':	
			return showInfoBox == 1;
		default:
			return true;
	}
}

/**
 * @param {JSEvent} event
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"F0B7A8F4-8218-4E9A-928F-406E2BE82712"}
 */
function showEditorInDialog(event) {
	if(!solutionModel.getForm('documentEditor_popup')) {
		solutionModel.cloneForm('documentEditor_popup',solutionModel.getForm(controller.getName()));
	}
	
	var window = application.createWindow('myWindow',JSWindow.MODAL_DIALOG);
	window.setSize(1200,800)
	window.show(forms['documentEditor_popup'])

}

/**
 * @param oldValue
 * @param newValue
 * @param {JSEvent} event
 *
 * @return {boolean}
 *
 * @protected
 *
 * @properties={typeid:24,uuid:"F8DCF8EF-A60D-4154-992C-0687FEC5E710"}
 */
function onDataChange(oldValue, newValue, event) {
	application.output('onDataChange oldValue Size: ' + (oldValue||'').length + ' newValue Size: ' + (newValue||'').length);
	return true
}
