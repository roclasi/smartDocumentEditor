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

            if ($scope.model.editorStyleSheet) {
                var url = $scope.model.editorStyleSheet;
                url = url.split('?')[0];
                var head = document.getElementsByTagName('head')[0];
                var cssHref = document.createElement('link');
                cssHref.setAttribute("rel", "stylesheet");
                cssHref.setAttribute("type", "text/css");
                cssHref.setAttribute("href", url);
                head.appendChild(cssHref);
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
                        $scope.editor.isReadOnly = value;
                        break;
                    case "visible":
                        if(value == false) {
                            if($scope.editor) {
                                $scope.editor.destroy().then(() => {
                                    $scope.editor = null;
                                });
                            }
                        } else {
                            if(!$scope.editor) {
                                $timeout(function() {
                                    createEditor($scope.model.config);
                                }, 0)
                            }
                        }
                        break;
                    case "showToolbar":
                            if(value == true && $scope.editor) {
                                $timeout(function() {
                                    $element.querySelectorAll('.document-editor__toolbar')[0].replaceChildren( $scope.editor.ui.view.toolbar.element );
                                    $element.querySelectorAll('.ck-toolbar')[0].classList.add( 'ck-reset_all' );
                                },0)
                            }
                        break;
                    }
                }
            });

            var destroyListenerUnreg = $scope.$on("$destroy", function() {
                destroyListenerUnreg();
                delete $scope.model[$sabloConstants.modelChangeNotifier];
            });

            /*********************************************
             * General Functions / Classes for CKEditor
             *********************************************/

             /**
              * Function called by AutoSave plugin in CKEditor
              * @param {String} data 
              */
            function forceSaveData( data ) {
                if($scope.model.readOnly !== true) {
                    console.debug( 'CKEditor save Trigger, saving data');
                    $scope.model.dataProviderID = data;
                    $scope.svyServoyapi.apply('dataProviderID');
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
                            const mentionAttribute = editor.plugins.get('Mention').toMentionAttribute( viewItem, {
                                realValue: viewItem.getAttribute('data-real-value')
                            });
                            return mentionAttribute;
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

                        var attributes,
                            elementType;
                        if (modelAttributeValue.isPlaceholderMention) {
                            elementType = 'span';
                            attributes = {
                                class: 'svy-placeholder ck-widget',
                                'name': modelAttributeValue.name,
                                'dataprovider': modelAttributeValue.dataProvider,
                                'format': modelAttributeValue.format,
                                'contenteditable': false
                            }
                        } else {
                            elementType = 'span';
                            attributes = {
                                class: 'mention svy-mention',
                                'data-mention': modelAttributeValue.id,
                                'data-real-value': (modelAttributeValue.realValue == undefined ? '' : modelAttributeValue.realValue),
                                'contenteditable': (modelAttributeValue.editable == undefined ? true : modelAttributeValue.editable)
                            }
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
                // if ($scope.editor) {
                //     $scope.editor.execute('servoyPlaceholder', { displayName: item.name, dataProvider: item.dataProvider, format: item.format });
                // }
                const itemElement = document.createElement('span');
                itemElement.classList.add('svy-mention');
                itemElement.id = 'mention-id-' & item.id;
                itemElement.textContent = item.name;

                return itemElement;
            }

            function getFeeds() {
                var result = [];

                //add placeholder mention
                if ($scope.model.placeholderMarker) {
                    const plcHolderMention = {
                        marker : $scope.model.placeholderMarker,
                        itemRenderer : svyMentionRenderer,
                        minimumCharacters: 0,
                        feed : function(queryText) {
                            var plcHolderItems = getPlaceholderItems();
                            if (plcHolderItems.length) {
                                return new Promise(resolve => {
                                    const searchString = queryText.toLowerCase();
                                    let list = plcHolderItems
                                        // Filter out the full list of all items to only those matching the query text.
                                        // Order startWith before contains
                                        .filter((item) => {
                                            return item.displayName.toLowerCase().startsWith(searchString);
                                        })
                                    list = list.concat(plcHolderItems.filter((item) => {
                                        return !item.displayName.toLowerCase().startsWith(searchString) && item.displayName.toLowerCase().includes(searchString);
                                    }))

                                    list = list.slice(0, 10)
                                        //Map /Convert default valuelist names to matching object keys for tags
                                        .map((item) => {
                                            return {
                                                name: item.displayName,
                                                id: $scope.model.placeholderMarker + item.displayName,
                                                dataProvider: item.dataProvider,
                                                format: item.format || '',
                                                editable: false,
                                                isPlaceholderMention: true
                                            }
                                        });
                                    resolve(list);
                                })
                            } else {
                                return [];
                            }
                        }
                    }
                    result.push(plcHolderMention);
                }

                //add other mentions
                if ($scope.model.mentionFeeds) {
                    for (let i = 0; i < $scope.model.mentionFeeds.length; i++) {
                        const feed = $scope.model.mentionFeeds[i];
                        if (!feed.marker) {
                            console.warn('No marker provided for mention feed');
                            continue;
                        }
                        result.push(
                            {
                                marker: feed.marker,
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
                                                        editable: feed.itemEditable
                                                    }
                                                });

                                            resolve(list);
                                        });
                                    } else if (feed.feedItems) {
                                        return feed.feedItems.map((entry) => {
                                            return {
                                                name: entry.displayValue.toString(),
                                                id: feed.marker.toString() + entry.displayValue.toString(),
                                                realValue: entry.realValue,
                                                editable: feed.itemEditable
                                            }
                                        })
                                    } else {
                                        return [];
                                    }
                                },
                                minimumCharacters: feed.minimumCharacters || 0,
                                itemRenderer: svyMentionRenderer
                            }
                        )
                    }
                }
                return result;
            }

            /*********************************************
             * Placeholder
             *********************************************/

            /**
             * Returns an array of all placeholder items that could be used in mention or a toolbar dropdown
             */
            function getPlaceholderItems() {
                if ($scope.model.placeholders && $scope.model.placeholders.length) {
                    return $scope.model.placeholders.map(function(placeholderEntry) {
                        return {
                            displayName: placeholderEntry.displayName || placeholderEntry.dataProvider,
                            dataProvider: placeholderEntry.dataProvider,
                            format: placeholderEntry.format || ''
                        }
                    })
                } else {
                    return [];
                }
            }

            /**
             * Returns the config used for the placeholder toolbar drop down
             */
            function getPlaceholderUIConfig() {
                if ($scope.model.toolbarItems && $scope.model.toolbarItems.length > 0) {
                    var placeHolderItem = $scope.model.toolbarItems.filter((item) => {
                        return item.type === 'servoyPlaceholder';
                    });
                    if (placeHolderItem.length) {
                        return {
                                name: placeHolderItem[0].name,
                                label: placeHolderItem[0].label || 'Placeholder',
                                withText: placeHolderItem[0].withText,
                                isEnabled: placeHolderItem[0].isEnabled,
                                withTooltip: placeHolderItem[0].tooltip || null,
                                iconStyleClass: placeHolderItem[0].iconStyleClass || null
                            };
                    }
                }
                return null;
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
                if ($scope.model.toolbarItems && $scope.model.toolbarItems.length > 0) {
                    return $scope.model.toolbarItems.filter((item) => {
                        return item.type === 'servoyToolbarItem';
                    }).map((item) => {
                        return {
                            name: item.name,
                            label: item.label,
                            withText: item.withText || false,
                            isEnabled: item.isEnabled || false,
                            tooltip: item.tooltip || null,
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
                if ($scope.model.showToolbar && $scope.model.toolbarItems && $scope.model.toolbarItems.length > 0) {
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
                } else if ($scope.model.showToolbar) {
                    return [
                        'heading',
                        '|',
                        'fontfamily',
                        'fontsize',
                        'fontColor',
                        '|',
                        'bold',
                        'italic',
                        'underline',
                        'strikethrough',
                        '|',
                        'alignment',
                        '|',
                        'numberedList',
                        'bulletedList',
                        '|',
                        'indent',
                        'outdent',
                        '|',
                        'link',
                        'imageUpload',
                        'insertTable'
                    ]
                } else {
                    return null;
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

            $scope.$watch('model.config', (newVal, oldVal) => {
                if (newVal != oldVal) {
                    //(re)create editor
                    if ($scope.editor) {
                        $scope.editor.destroy().then(() => {
                            $scope.editor = null;
                            $timeout(function() {
                                createEditor(newVal);
                            } , 0)
                        });
                    } else {
                        $timeout(function() {
                            createEditor(newVal);
                        }, 0)
                    }
                }
            })

            /*********************************************
             * Init & Setup CKEditor
             *********************************************/

            if (!$scope.model.config) {
                var emptyConfig = {}

                if ($scope.model.showToolbar) {
                    emptyConfig.toolbar = {
                        items: getToolbarItems()
                    }
                    emptyConfig.svyToolbarItems = getSvyToolbarItems();
                }

                $scope.model.config = emptyConfig;
            }

            /**
             * Creates an editor instance
             * @param {*} orgConfig 
             */
            function createEditor(orgConfig) {
                var config = orgConfig;
                if($scope.model.visible == true) {
                    if($scope.model.showToolbar) {
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

                        if (!config.svyToolbarItems) {
                            //make sure custom toolbar items are created
                            config.svyToolbarItems = getSvyToolbarItems();
                        }

                        if (!config.svyPlaceholderConfig) {
                            //get config for a possible servoyPlaceholder toolbar entry
                            config.svyPlaceholderConfig = getPlaceholderUIConfig();
                        }
                    } else {
                        if(config.toolbar) {
                            delete config.toolbar;
                        }
                        if(config.svyToolbarItems) {
                            delete config.svyToolbarItems;
                        }
                        if(config.svyPlaceholderConfig) {
                            delete config.svyPlaceholderConfig;
                        }
                    }

                    if (!config.svyPlaceholderItems) {
                        //get config for a servoyPlaceholder items
                        config.svyPlaceholderItems = getPlaceholderItems();
                    }
                    
                    if ($scope.model.placeholderMarker || ($scope.model.mentionFeeds && $scope.model.mentionFeeds.length)) {
                        //add placeholder mention feed
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

                    if($element.querySelectorAll('.ckeditor').length > 0) {
                        DecoupledEditor.create($element.querySelectorAll('.ckeditor')[0], config).then(editor => {
                            $scope.editor = editor;
                            
                            const view = editor.editing.view;
                            const viewDocument = view.document;

                            if ($scope.model.showInspector == true) {
                                CKEditorInspector.attach(editor)
                            }

                            // Set a custom container for the toolbar
                            if ($scope.model.showToolbar) {
                                $element.querySelectorAll('.document-editor__toolbar')[0].replaceChildren( editor.ui.view.toolbar.element );
                                $element.querySelectorAll('.ck-toolbar')[0].classList.add( 'ck-reset_all' );
                            } 

                            const setData = () => {
                                const data = editor.getData();
                                const value = $scope.model.dataProviderID || ''
                                if (data !== value) {
                                    editor.setData(value);
                                }
                            }
                            $scope.$watch('model.dataProviderID', (newVal, oldVal) => {
                                console.log('Update CKEditor Context: The data has changed from external!');
                                setData();
                            })

                            editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                                return new ServoyUploadAdapter(loader);
                            };

                            if ($scope.model.overWriteTabForEditor == true) {
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

                            editor.ui.focusTracker.on( 'change:isFocused', ( evt, data, isFocused ) => {
                                if(isFocused) {
                                    if ($scope.handlers.onFocusGainedMethodID) {
                                        $scope.handlers.onFocusGainedMethodID(createJSEvent(event, 'focusGained'));
                                    }
                                } else {
                                    if ($scope.handlers.onFocusLostMethodID) {
                                        $scope.handlers.onFocusLostMethodID(createJSEvent(event, 'focusLost'));
                                    }
                                }
                            } );

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
                }
            }

            if (!$scope.svyServoyapi.isInDesigner()) {
                $timeout(function() {
                    createEditor($scope.model.config);
                }, 0);
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
                    if($scope.model.readOnly == true || !$scope.editor) {
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
                    if($scope.model.readOnly == true || !$scope.editor) {
                        return false;
                    }

                    for (let i = 0; i < $scope.model.mentionFeeds.length; i++) {
                        if($scope.model.mentionFeeds[i].marker === marker.toString()) {
                            const feed = $scope.model.mentionFeeds[i];
                            const list = feed.valueList.filter((item) => {
                                                return (item.realValue||item.displayValue).toString() == tag.toString();
                                            })
                            if(list.length > 0) {
                                $scope.editor.execute('mention', { marker: marker.toString(), mention:  {
                                        name: list[0].displayValue.toString(),
                                        id: feed.marker.toString() + list[0].displayValue.toString(),
                                        realValue: list[0].realValue,
                                        editable: feed.itemEditable
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

            /**
             * Test method to replace data in a svy-placeholder element
             * @param {JSRecord} record 
             */
            $scope.api.showPlaceholderRealData = function(record) {
                $scope.editor.model.change ( writer => {
                    const rangeInRoot = writer.createRangeIn( $scope.editor.model.document.getRoot() );

                    for ( const item of rangeInRoot.getItems() ) {
                        if (item.name === 'svy-placeholder') {
                            //placeholder item found
                            console.log(item);
                        }
                    }
                })
            }

        },
      templateUrl: 'smartdocumenteditor/smartdocumenteditor/smartdocumenteditor.html'
    };
  }])