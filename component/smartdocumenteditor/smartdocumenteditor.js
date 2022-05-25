angular
.module('smartdocumenteditorSmartdocumenteditor', ['servoy', 'sabloApp'])
.directive('smartdocumenteditorSmartdocumenteditor', ['$sabloConstants', '$sabloApplication', '$window', '$utils', '$timeout', 
function($sabloConstants, $sabloApplication, $window, $utils, $timeout) {  
    return {
        restrict: 'E',
        scope: {
            model: '=svyModel',
            handlers: "=svyHandlers",
            api: "=svyApi",
            svyServoyapi: "="
        },
        link: function($scope, $element, $attrs) {
            $scope.editor = null;
            $scope.createEditorQueue = [];

            var VIEW_TYPE = {
            	WEB: 'WEB',
				DOCUMENT: 'DOCUMENT'
            }
            
            /*********************************************
             * Sablo Contant listner for properties
             *********************************************/
            Object.defineProperty($scope.model, $sabloConstants.modelChangeNotifier, {
                configurable: true,
                value: function(property, value) {
                    switch (property) {
                    //When type is set to document view, add the correct styleclasses to init the documentview layout
                    case "viewType":
                        var div = $($element.children()[0]);
                        if(value == 'DOCUMENT') {
                            if(!div.hasClass('ckeditor-documentview')) {
                                div.addClass('ckeditor-documentview');
                            }
                        } else {
                            if(div.hasClass('ckeditor-documentview')) {
                                div.removeClass('ckeditor-documentview');
                            }
                        }
                        break;
                    case "readOnly":
                        if($scope.editor) {
                            $scope.editor.isReadOnly = !!value;
                        }
                        break;
                    case "visible":
                        if(!$scope.model.visible){
                            $element.css("display","none");
                        } else {
                            $element.css("display","");
                        }
                        break;
                    case "showToolbar":
                            if(value && $scope.editor) {
                                $timeout(function() {
                                    if($scope.editor) {
                                        $element.querySelectorAll('#toolbar-container')[0].replaceChildren( $scope.editor.ui.view.toolbar.element );
                                        $element.querySelectorAll('.ck-toolbar')[0].classList.add( 'ck-reset_all' );
                                    }
                                },0)
                            }
                        break;
					case "responsiveHeight":
						setHeight();
						break;

                    case "editorStyleSheet":
                        
                        //Remove old one if its there
                        angular.element("head > [customSmartDocumentEditor]").remove();
                        //Add new client stylesheet
                        if(value) {
                            var url = value.split('?')[0];
                            var additions = value.split('?')[1].split('&').filter((item) => {
                                return item.startsWith('clientnr');
                            });
                            if(additions.length) {
                                url += '?' + additions.join('&');
                            }

                            console.debug('Setting new customSmartDocumentEditor url: ' + url);

                            var head = angular.element("head");
                            var cssHref = $window.document.createElement('link');
                            cssHref.setAttribute("rel", "stylesheet");
                            cssHref.setAttribute("type", "text/css");
                            cssHref.setAttribute("href", url);
                            cssHref.setAttribute("customSmartDocumentEditor", "");
                            head.append(cssHref);
                        }
                        break;
                    }

                }
            });

            var destroyListenerUnreg = $scope.$on("$destroy", function() {
                destroyListenerUnreg();
                delete $scope.model[$sabloConstants.modelChangeNotifier];
                delete $scope.model.config.autosave;
                
                if($scope.editor) {
                    $scope.editor.destroy().then(() => {
                        $scope.editor = null;
                    });
                }
            });
            
            /*********************************************
             * Set the editor height
             *********************************************/
            
			function isResponsive() {
				return !$scope.$parent.absoluteLayout;
			}

			function setHeight() {
				if (isResponsive()) {
		            /** The html Div container of the smartdocument editor */
		            var editorDiv = $element.children()[0];
                     if ($scope.model.responsiveHeight) {
						editorDiv.style.height = $scope.model.responsiveHeight + 'px';
					} else {
						// when responsive height is 0 or undefined, use 100% of the parent container.
						editorDiv.style.height = '100%';
					}
				} 
			}

            /*********************************************
             * General Functions / Classes for CKEditor
             *********************************************/
            /**
             * Function to filter custom editorStylesheet from extra additions;
             * @returns {String}
             */
            function getEditorCSSStylesheetName() {
                if($scope.model.editorStyleSheet) {
                    var name = $scope.model.editorStyleSheet.split('?')[0];
                    name = name.split('/').pop();
                    return name;
                } else {
                    return null;
                }
            }
             /**
              * Function called by AutoSave plugin in CKEditor
              * @param {String} data 
              */
            function forceSaveData( data ) {
                if($scope.editor) {
                    console.debug( 'Editor push Trigger (ID: ' + $scope.editor.id + ', readOnly: ' + $scope.model.readOnly + ', formname: ' +  $scope.$parent['formname'] + ') , pushing data');
                    if(!$scope.model.readOnly && $scope.editor && !$scope.prePreviewData) {
                        $scope.model.dataProviderID = data;
                        $scope.svyServoyapi.apply('dataProviderID');
                    }
                }
            }

            /**
             * Generate UUIDv4
             * @returns {String}
             */
            function uuidv4() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
            }


            /*********************************************
             * Upload
             *********************************************/

            class ServoyUploadAdapter {
                constructor(loader) {
                    // The file loader instance to use during the upload.
                    this.loader = loader;
                }

                _initRequest() {
                    const xhr = this.xhr = new XMLHttpRequest();
                    var uploadUrl = this._getFileUploadURL();
                    if (uploadUrl) {
                        xhr.open('POST', uploadUrl, true);
                        xhr.responseType = 'json';
                    } else {
                        throw Error('No onFileUploadMethod defined');
                    }
                }

                // Initializes XMLHttpRequest listeners.
                _initListeners(resolve, reject, file, uniekFileId) {
                    const xhr = this.xhr;
                    const loader = this.loader;
                    const genericErrorText = `Couldn't upload file: ${file.name}.`;

                    xhr.addEventListener('error', () => reject(genericErrorText));
                    xhr.addEventListener('abort', () => reject());
                    xhr.addEventListener('load', () => {
                        //reject so nothing happens in the editor; the image has to be inserted by the onFileUploadedMethodID
                        reject();
                    });

                    if (xhr.upload) {
                        xhr.upload.addEventListener('progress', evt => {
                            if (evt.lengthComputable) {
                                loader.uploadTotal = evt.total;
                                loader.uploaded = evt.loaded;
                            }
                        });
                    }
                }

                // Prepares the data and sends the request.
                _sendRequest(file, uniqueFileID) {
                    var data = this._createFormDataUpload(file, { 'imageID': uniqueFileID })
                    // Send the request.
                    this.xhr.send(data);
                }

                //Create formDataUpload
                _createFormDataUpload(file, metadata) {
                    var formPost = new FormData();
                    var metaFields = Object.keys(metadata);
                    metaFields.forEach(function (item) {
                        formPost.append(item, metadata[item]);
                    });
                    formPost.append('upload', file, file.name);

                    return formPost;
                }

                //Get servoy fileUpload url
                _getFileUploadURL() {
                    var parent = $scope.$parent;

                    var beanname = $element.attr("name");
                    if (!beanname) {
                        var nameParentEl = $element.parents("[name]").first();
                        if (nameParentEl) beanname = nameParentEl.attr("name");
                    }
                    if (!beanname) {
                        for (var key in parent['model']) {
                            if (parent['model'][key] === beanModel) {
                                beanname = key;
                                break;
                            }
                        }
                    }
                    var rowID = parent['rowID'];
                    var formname = parent['formname'];
                    while (!formname) {
                        if (parent.$parent) {
                            parent = parent.$parent;
                            formname = parent['formname'];
                        } else {
                            break;
                        }
                    }
                    var uploadURL;
                    if (beanname && formname) {
                        if ($scope.handlers.onFileUploadedMethodID) {
                            uploadURL = "resources/upload/" + $sabloApplication.getClientnr() + "/" + formname + "/" + beanname + "/onFileUploadedMethodID";
                            if (rowID) {
                                uploadURL += "/" + encodeURIComponent(rowID)
                            }
                        }
                    }

                    return uploadURL;
                }

                // Starts the upload process.
                upload() {
                    if (!$scope.handlers.onFileUploadedMethodID) {
                        //base64 upload
                        return new Promise( ( resolve, reject ) => {
                            const reader = this.reader = new window.FileReader();
                
                            reader.addEventListener( 'load', () => {
                                resolve( { default: reader.result } );
                            } );
                
                            reader.addEventListener( 'error', err => {
                                reject( err );
                            } );
                
                            reader.addEventListener( 'abort', () => {
                                reject();
                            } );
                
                            this.loader.file.then( file => {
                                reader.readAsDataURL( file );
                            } );
                        } );
                    } else {
                        //upload to resources/upload
                        return this.loader.file.then(file => new Promise((resolve, reject) => {
                            var uniqueFileID = uuidv4();
                            this._initRequest();
                            this._initListeners(resolve, reject, file, uniqueFileID);
                            this._sendRequest(file, uniqueFileID);
                        }));
                    }
                }

                // Aborts the upload process.
                abort() {
                    if (!$scope.handlers.onFileUploadedMethodID) {
                        this.reader.abort();
                    } else if (this.xhr) {
                        this.xhr.abort();
                    }
                }
            }

            /*********************************************
             * Mention
             *********************************************/

            function SvyMentionConverter(editor) {
                editor.conversion.for( 'upcast' ).elementToAttribute( {
                    view: {
                        name: 'span',
                        key: 'data-mention',
                        classes: 'mention',
                        attributes: {
                            'data-real-value': true,
                            'contenteditable': true
                        }
                    },
                    model: {
                        key: 'mention',
                        value: viewItem => {
                            return editor.plugins.get('Mention').toMentionAttribute( viewItem, {
                                realValue: viewItem.getAttribute('data-real-value'),
                                format: viewItem.getAttribute('data-format'),
                                contenteditable: viewItem.getAttribute('contenteditable')
                            });
                        }
                    },
                    converterPriority: 'high'
                });

                editor.conversion.for( 'downcast' ).attributeToElement( {
                    model: 'mention',
                    view: ( modelAttributeValue, { writer } ) => {
                        // Do not convert empty attributes (lack of value means no mention).
                        if ( !modelAttributeValue ) {
                            return;
                        }

                        var elementType = 'span';
                        var attributes = {
                            class: 'mention svy-mention',
                            'data-mention': modelAttributeValue.id,
                            'data-real-value': (modelAttributeValue.realValue == undefined ? '' : modelAttributeValue.realValue),
                            'contenteditable': (modelAttributeValue.editable == undefined ? false : modelAttributeValue.editable),
                            'data-format': (modelAttributeValue.format || ''),
                        }
                        return writer.createAttributeElement( elementType, attributes, {
                            // Make mention attribute to be wrapped by other attribute elements.
                            priority: 20,
                            // Prevent merging mentions together.
                            id: modelAttributeValue.uid
                        } );
                    },
                    converterPriority: 'high'
                } );
            }

            function svyMentionRenderer(item) {
                const itemElement = document.createElement('span');
                itemElement.classList.add('svy-mention');
                itemElement.id = 'mention-id-' & item.id;
                itemElement.textContent = item.name;

                return itemElement;
            }

            function getFeeds() {
                var result = [];

                //add other mentions
                if ($scope.model.mentionFeeds) {
                    for (let i = 0; i < $scope.model.mentionFeeds.length; i++) {
                        const feed = $scope.model.mentionFeeds[i];
                        //Skip feed parsing.. if there is nothing to parse;
                        if(!feed.valueList && !feed.feedItems) {
                            continue;
                        }
                        
                        if (!feed.marker) {
                            console.warn('No marker provided for mention feed');
                            continue;
                        }
                        result.push(
                            {
                                marker: feed.marker,
                                minimumCharacters: feed.minimumCharacters||0,
                                feed: function (queryText) {
                                    if (feed.valueList) {
                                        return new Promise(resolve => {
                                            const list = feed.valueList
                                                // Filter out the full list of all items to only those matching the query text.
                                                .filter((item) => {
                                                    const searchString = queryText.toLowerCase();
                                                    return item.displayValue.toString().toLowerCase().includes(searchString);
                                                })
                                                // Return 10 items max - needed for generic queries when the list may contain hundreds of elements.
                                                .slice(0, 10)
                                                //Map /Convert default valuelist names to matching object keys for tags
                                                .map((item) => {
                                                    return {
                                                        name: item.displayValue.toString(),
                                                        id: feed.marker.toString() + item.displayValue.toString(),
                                                        realValue: item.realValue,
                                                        editable: feed.itemEditable||false
                                                    }
                                                });

                                            resolve(list);
                                        });
                                    } else if (feed.feedItems) {
                                    	// Filter the feedItems matching the searchString
                                    	var matchedItems = feed.feedItems.filter((entry) => {
                                            const searchString = queryText.toLowerCase();
                                            return entry.displayValue.toString().toLowerCase().includes(searchString);
                                        });
                                    	
                                        return matchedItems.map((entry) => {
                                            return {
                                                name: entry.displayValue.toString(),
                                                id: feed.marker.toString() + entry.displayValue.toString(),
                                                realValue: entry.realValue,
                                                format: entry.format||'',
                                                editable: feed.itemEditable||false
                                            }
                                        })
                                    } else {
                                        return [];
                                    }
                                },
                                itemRenderer: svyMentionRenderer
                            }
                        )
                    }
                }
                return result;
            }

             /*********************************************
             * Toolbar
             *********************************************/
            var JSEvent = null;
             /**
             * Create a JSEvent
             *
             * @return {JSEvent}
             */
            function createJSEvent(event, eventType) {
                if(event) {
                    JSEvent = $utils.createJSEvent(event, eventType);
                } else {
                    if(JSEvent) {
                        JSEvent.eventType = eventType;
                        JSEvent.timestamp = new Date().getTime();
                    }
                }
                return JSEvent;
            }

             /**
              * Returns all custom servoy toolbar items
              */
            function getSvyToolbarItems() {
                // Style of icon styleClass is overriden by the ck-reset class; causing issues in showing font icons. This is an known issue of CKEditor
                // https://stackoverflow.com/questions/65605215/prevent-from-being-added-ck-reset-classes-in-ckeditor-5
            	if ($scope.model.toolbarItems && $scope.model.toolbarItems.length > 0) {
                    return $scope.model.toolbarItems.filter((item) => {
                        return item.type === 'servoyToolbarItem';
                    }).map((item) => {
                        return {
                            name: item.name,
                            label: item.label,
                            withText: item.withText || false,
                            isEnabled: item.isEnabled || false,
                            withTooltip: item.tooltip || null,
                            iconStyleClass: item.iconStyleClass || null,
                            ignoreReadOnly: item.ignoreReadOnly || false,
                            valueList: item.valueList,
                            onClick: item.onClick ? (buttonView, dropDownValue) => { 
                                var jsevent = createJSEvent(event, 'action');
                                $window.executeInlineScript(item.onClick.formname, item.onClick.script, [jsevent, item.name, dropDownValue || null])
                            } : null
                        }
                    })
                }
            }

            /**
             * Generate Toolbar menubar items
             * @returns {Array<String>}
             */
            function getToolbarItems() {
                if ($scope.model.toolbarItems && $scope.model.toolbarItems.length > 0) {
                    return $scope.model.toolbarItems.map((item) => {
                        if (item.type === 'separator') {
                            return '|'
                        } else if (item.type === 'wrappingBreakpoint') {
                            return '-'
                        } else if (item.type === 'servoyToolbarItem') {
                            return item.name;
                        } else {
                            return item.type;
                        }
                    })
                } else  {
                    return [];
                }
            }

            /**
             * Get current client language
             * @returns {String} 
             */
            function getCurrentLanguage() {
                if ($scope.model.language) {
                    return $scope.model.language;
                }
                var locale = $sabloApplication.getLocale();
                if (locale.language) {
                    return locale.language;
                }
                return 'en';
            }

            var editorTimeout;
            var configToApply;
            $scope.$watch('createEditorQueue', (newVal, oldVal) => {
                if(newVal.length > 0) {
                    if(editorTimeout) {
                        $timeout.cancel(editorTimeout);
                    }
                    configToApply = newVal.pop();
                    editorTimeout = $timeout(function() {
                        if($scope.editor) {
                            $scope.editor.destroy().then(() => {
                                $scope.editor = null;
                                createEditor(configToApply);
                            });
                        } else {
                            createEditor(configToApply);
                        }
                    }, 50);
                }
            },true);

            $scope.$watch('model.config', (newVal, oldVal) => {
                if (newVal && newVal != oldVal) {
                    $scope.createEditorQueue.push($scope.model.config);
                }
            })
			
			$scope.$watch('model.mentionFeeds', (newVal, oldVal) => {
                if (newVal && newVal != oldVal) {
                    $scope.createEditorQueue.push($scope.model.config);
                }
            })

            /*********************************************
             * Init & Setup CKEditor
             *********************************************/

            if (!$scope.model.config) {
                var emptyConfig = {}

                emptyConfig.toolbar = {
                    items: getToolbarItems()
                }
                emptyConfig.svyToolbarItems = getSvyToolbarItems();

                $scope.model.config = emptyConfig;
            }

            /**
             * Creates an editor instance
             * @param {*} orgConfig 
             */
            function createEditor(orgConfig) {
                var config = orgConfig;
                // if($scope.model.visible) {
                    //make sure toolbar items are taken from the model.toolbarItems array
                    if (config.toolbar && config.toolbar.items) {
                        //toolbar property is an object with items array
                        //that array needs to be recreated from model.toolbarItems to ensure svyToolbarItems are properly created
                        config.toolbar.items = getToolbarItems();
                    } else if (config.toolbar) {
                        //toolbar property is a plain array
                        //that array needs to be recreated from model.toolbarItems to ensure svyToolbarItems are properly created
                        config.toolbar = {
                            items: getToolbarItems()
                        }
                    }

                    //make sure custom toolbar items are created
                    //We should always load them, else the valuelists don't get an update to show the correct values
                    config.svyToolbarItems = getSvyToolbarItems();
                    
                    if ($scope.model.mentionFeeds && $scope.model.mentionFeeds.length) {
                        config.mention = {
                            feeds: getFeeds()
                        }

                        if (!config.hasOwnProperty('extraPlugins') || config.extraPlugins.indexOf(SvyMentionConverter) === -1) {
                            if (config.hasOwnProperty('extraPlugins')) {
                                config.extraPlugins.push(SvyMentionConverter);
                            } else {
                                config.extraPlugins = [SvyMentionConverter];
                            }
                        }
                    }

                    if (!config.autosave) {
                        config.autosave = {
                            save(editor) {
                                return new Promise(resolve => {
                                    setTimeout(() => {
                                        forceSaveData(editor.getData())
                                        resolve();
                                    }, 200);
                                });
                            }
                        }
                    }

                    if (!config.language) {
                        config.language = getCurrentLanguage();
                    }

                    // note The pagination feature is by default enabled only in browsers that are using the Blink engine (Chrome, Chromium, newer Edge, newer Opera). 
                    // This behavior can be modified by setting this configuration option to true.
                    // config.pagination.enableOnUnsupportedBrowsers
                    if (!config.pagination) {
                        if ($scope.model.viewType == VIEW_TYPE.DOCUMENT) {
                            // TODO does require the pagination plugin ?
                        
                            // NOTE: when height is auto, in responsive form cannot use pagination.
                            config.pagination = {
                                // A4
                                pageWidth: '21cm',
                                pageHeight: '29.7cm',
                                pageMargins: {
                                    top: '20mm',
                                    bottom: '20mm',
                                    right: '12mm',
                                    left: '12mm'
                                }
                            }
                        }
                    }

                    if(!config.licenseKey) {
                        // this key is not part of the open source license, can only be used in combination of the Servoy Smart Document component
                        config.licenseKey = 'jIeCooHjrvzWP3N27U66AHcpmT4bYoBPXCFjmk9gaLHxyCGmQyvkzh6kv+UJvg==';
                    }

                    if($element.querySelectorAll('#editor').length > 0) {
                        DecoupledEditor.create($element.querySelectorAll('#editor')[0], config).then(editor => {
                            $scope.editor = editor;
                            console.debug('Creating editor: (id: ' + editor.id + ', formname: ' +  $scope.$parent['formname'] + ', autosave: ' + !!config.autosave + ')')
                            
                            const view = editor.editing.view;
                            const viewDocument = view.document;

                            if ($scope.model.showInspector) {
                                CKEditorInspector.attach(editor)
                            }

                            // Set a custom container for the toolbar
                            if ($scope.model.showToolbar) {
                                $element.querySelectorAll('#toolbar-container')[0].replaceChildren( editor.ui.view.toolbar.element );
                                $element.querySelectorAll('.ck-toolbar')[0].classList.add( 'ck-reset_all' );
                            } 

                            const setData = () => {
                                console.debug('Update Editor Context (ID: ' + editor.id + ', hasFocus: ' + editor.editing.view.document.isFocused + ', formname: ' +  $scope.$parent['formname'] + ') : The data has changed from external!');
                                if(!$scope.editor.editing.view.document.isFocused) {
                                    const data = editor.getData();
                                    const value = $scope.model.dataProviderID || ''
                                    if (data !== value) {
                                        editor.setData(value);
                                    }
                                }
                            }
                            //Init always set the data
                            setData();
                            $scope.$watch('model.dataProviderID', (newVal, oldVal) => {
                                setData();
                            })

                            editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                                return new ServoyUploadAdapter(loader);
                            };
                            
                            // Disable the plugin so that no pagination is use are visible.
                            if ($scope.model.viewType != VIEW_TYPE.DOCUMENT) {
                                editor.plugins.get( 'Pagination' ).isEnabled = false;
                            }

                            if ($scope.model.overWriteTabForEditor) {
                                viewDocument.on('keydown', (evt, data) => {
                                    if ((data.keyCode == 9) && viewDocument.isFocused) {
                                        // $scope.editor.execute( 'input', { text: "\t" } );
                                        editor.execute('input', { text: "     " });

                                        evt.stop(); // Prevent executing the default handler.
                                        data.preventDefault();
                                        view.scrollToTheSelection();
                                    }
                                });
                            }

                            if($scope.handlers.onFocusGainedMethodID || $scope.handlers.onFocusLostMethodID) {
                                editor.ui.focusTracker.on( 'change:isFocused', ( evt, data, isFocused ) => {
                                    if(isFocused) {
                                        if ($scope.handlers.onFocusGainedMethodID) {
                                            $scope.handlers.onFocusGainedMethodID(createJSEvent(event, 'focusGained'));
                                        }
                                    } else {
                                        if ($scope.handlers.onFocusLostMethodID) {
                                            $scope.handlers.onFocusLostMethodID(createJSEvent(event, 'focusLost'));
                                        }
                                        forceSaveData(editor.getData())
                                    }
                                } );
                            }

                            if($scope.handlers.onActionMethodID) {
                                editor.listenTo(editor.editing.view.document, 'click', (evt) => {
                                    if($scope.model.readOnly) {
                                        $scope.handlers.onActionMethodID(createJSEvent(event, 'onAction'));
                                    }
                                })
                            }

                        }).then(() => {
                            // data can already be here, if so call the modelChange function so
                            // that it is initialized correctly. (After init of CKEditor)
                            var modelChangFunction = $scope.model[$sabloConstants.modelChangeNotifier];
                            for (var key in $scope.model) {
                                modelChangFunction(key, $scope.model[key]);
                            }

                            if ($scope.handlers.onReady) {
                                $scope.handlers.onReady();
                            }

                        }).catch(function (error) {
                            console.error(error);
                            if ($scope.handlers.onError) {
                                $scope.handlers.onError(error.message, error.stack);
                            }
                        });
                    }
                // }
            }

            if (!$scope.svyServoyapi.isInDesigner()) {
                $scope.createEditorQueue.push($scope.model.config);
            }

            /*********************************************
             * Init & Setup CKEditor
             *********************************************/

            /**
             * Force the autosave trigger of the editor to get all latest changes
             * @example elements.%%elementName%%.saveData();
             * @returns {Boolean}
             */
            $scope.api.saveData = function() {
                if($scope.editor) {
                    forceSaveData( $scope.editor.getData() );
                    return true;
                } 
                return false;
            }

            /**
             * Add input to current cursor position, will return false when in readOnly mode
             * @example elements.%%elementName%%.addInputAtCursor(input);
             * @param {String} input
             * @returns {Boolean}
             */
            $scope.api.addInputAtCursor = function(input) {
                if(input) {
                    if($scope.model.readOnly || !$scope.editor) {
                        return false;
                    }
                    $scope.editor.execute('input', { text: input })
                }
                return true;
            }

            /**
             * Add tag to current cursor position, will return false when in readOnly mode
             * @example elements.%%elementName%%.addTagAtCursor(tag);
             * @param {String} marker
             * @param {String} tag
             * @returns {Boolean}
             */
            $scope.api.addTagAtCursor = function(marker, tag) {
                if(tag) {
                    if($scope.model.readOnly || !$scope.editor) {
                        return false;
                    }

                    for (let i = 0; i < $scope.model.mentionFeeds.length; i++) {
                        if($scope.model.mentionFeeds[i].marker === marker.toString()) {
                            const feed = $scope.model.mentionFeeds[i];
                            const list = (feed.valueList||feed.feedItems).filter((item) => {
                                                return (item.realValue||item.displayValue).toString() == tag.toString();
                                            })
                         
                            if(list.length > 0) {
                                $scope.editor.execute('mention', { marker: marker.toString(), mention:  {
                                        name: list[0].displayValue.toString(),
                                        id: feed.marker.toString() + list[0].displayValue.toString(),
                                        realValue: list[0].realValue,
                                        format: list[0]['format']||'',
                                        editable: feed.itemEditable||false
                                    }
                                });
                                return true;
                            }
                        }
                    }
                }
                return false;
            }

            /**
             * Executes the specified command with given parameters.
             * @example elements.%%elementName%%.executeCommand(command, commandParameters);
             * @param {String} command the name of the command to execute
             * @param {*} [commandParameters] optional command parameters
             */
            $scope.api.executeCommand = function(command, commandParameters) {
                if ($scope.editor) {
                    $scope.editor.execute(command, commandParameters);
                }
            }

            /**
             * Executes the specified command with given parameters.
             * @example elements.%%elementName%%.executeCommand(command, commandParameters);
             * @param {String} command the name of the command to execute
             * @param {*} [commandParameters] optional command parameters
             */
            $scope.api.insertImage = function(source) {
                if ($scope.editor) {
                    $scope.editor.execute('imageInsert', { source: source });
                }
            }

            $scope.api.getHTMLData = function(withInlineCSS, filterStylesheetName) {
                if ($scope.editor) {
                    let data = '<html><body><div class="ck-content" dir="ltr">' + $scope.editor.getData() + '</div></body></html>';
                    if(withInlineCSS) {
                        data = DecoupledEditor.getInlineStyle(data, $scope.api.getCSSData(filterStylesheetName));
                    } 
                    return data;
                }
                return null;
            }

            $scope.api.getCSSData = function(filterStylesheetName) {
                if(filterStylesheetName) {
                    let cssStyleSheetFilterArray = [filterStylesheetName, getEditorCSSStylesheetName()];
                    let cssStyleSheetFilter = cssStyleSheetFilterArray.filter(value => {
                        return !!value;
                    })
                    return DecoupledEditor.getCssStyles(cssStyleSheetFilter);
                } else {
                    return DecoupledEditor.getCssStyles();
                }
            }

            $scope.api.getPrintCSSData = function() {
                return DecoupledEditor.getPrintCSS();
            }

            /**
             * Preview Editor HTML data into the editor
             * @param {String} html
             * @param {Boolean} [readOnly] set component into readOnly mode (default: true)
             * @public 
             */
            $scope.api.previewHTML = function(html, readOnly) {
                //Force save current HTML Editor;
                forceSaveData( $scope.editor.getData() );
                $scope.model.prePreviewData = $scope.editor.getData();
                $scope.editor.isReadOnly = !!(readOnly != undefined ? readOnly : true);
                $scope.editor.setData(html)
            }

            /**
             * Undo Preview Editor HTML data into the editor
             * @param {Boolean} [readOnly] set component into readOnly mode (default: false)
             * @public 
             */
            $scope.api.undoPreviewHTML = function(readOnly) {
                $scope.editor.setData($scope.model.prePreviewData);
                $scope.model.prePreviewData = null;
                $scope.editor.isReadOnly = !!(readOnly != undefined ? readOnly : false);
            }

            /**
             * Return if editor is in preview mode (CKEditor readOnly)
             * @returns boolean
             * @public 
             */
            $scope.api.isInPreviewMode = function() {
                return !!$scope.editor.isReadOnly;
            }
        },
      templateUrl: 'smartdocumenteditor/smartdocumenteditor/smartdocumenteditor.html'
    };
  }])