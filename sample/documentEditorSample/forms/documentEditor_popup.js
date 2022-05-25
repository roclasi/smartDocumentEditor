/**
 * @type {String}
 *
 * @properties={typeid:35,uuid:"4FE054F7-6F5B-4C48-98E5-A386D780C32D"}
 */
var CKDATA = null;

/**
*
* @type {scopes.svyDocEditor.DocumentEditor}
*
* @properties={typeid:35,uuid:"1E3B8634-E585-4215-AFB5-29CAAFA4B3B8",variableType:-4}
*/
var EDITOR_INSTANCE;


/**
 * @properties={typeid:35,uuid:"9E3B80DD-D688-4E61-A9FB-AF6E6E386D57",variableType:-4}
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
 * @param {JSEvent} event
 * @param {Boolean} firstShow
 *
 * @properties={typeid:24,uuid:"42B38652-B956-418B-A7C6-1DE41ACF1ABE"}
 * @AllowToRunInFind
 */
function onShow(event, firstShow) {
	CKDATA = solutionModel.getMedia('sample.html').getAsString();
	setupEditor(event);
}

/**
 * @param {JSEvent} event
 *
 * @private
 *
 * @properties={typeid:24,uuid:"6D862F6B-D892-4C54-842C-56A0186B829F"}
 */
function setupEditor(event) {
	EDITOR_INSTANCE = scopes.svyDocEditor.getInstance(elements.smartdocumenteditor);

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