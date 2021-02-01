/* TODO:
* Tags: Optie om voorbeeld data te zien live vanuit het geselecteerde record.
* Tags: Ook zichtbaar maken via een dropdown
* Repeating tables aan de hand van een tag.
	#repeatStart-factuurRegel #repeatStop-factuurRegel
* Table in Table Support?? (Optie)
* Document formaat: checken met juiste afmetingen + support voor andere formaten
* Document met zoomfunctie ??
* Headers & Footers & Pagebreak ??
* Afbeeldingen tonen vanuit een soort van Media
* PDF callback voor printen??
* N/A: Auto pagebreak when enter
*/

/**
 * DONE:
 * * Afbeelding upload via callback method
 * * Tabkey moet een indent doen
 */
angular
.module('ckeditorDocumenteditor', ['servoy', 'sabloApp'])
.directive('ckeditorDocumenteditor', ['$sabloConstants', '$sabloApplication', '$window', 
function($sabloConstants, $sabloApplication, $window) {  
    return {
        restrict: 'E',
        scope: {
            model: '=svyModel',
            handlers: "=svyHandlers",
            api: "=svyApi",
            svyServoyapi: "="
        },
        link: function($scope, $element, $attrs) {

            $scope.editor;

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
            class ServoyUploadAdapter {
                constructor( loader ) {
                    // The file loader instance to use during the upload.
                    this.loader = loader;
                }

                _initRequest() {
                    const xhr = this.xhr = new XMLHttpRequest();
                    var uploadUrl = this._getFileUploadURL();
                    if(uploadUrl) {
                        xhr.open( 'POST', uploadUrl, true );
                        xhr.responseType = 'json';
                    } else {
                        throw Error('No onFileUploadMethod defined');
                    }
                }

                // Initializes XMLHttpRequest listeners.
                _initListeners( resolve, reject, file , uniekFileId) {
                    const xhr = this.xhr;
                    const loader = this.loader;
                    const genericErrorText = `Couldn't upload file: ${ file.name }.`;

                    xhr.addEventListener( 'error', () => reject( genericErrorText ) );
                    xhr.addEventListener( 'abort', () => reject() );
                    xhr.addEventListener( 'load', () => {
                        //TODO: Maybe not a rest call back??
                        resolve({default: '/servoy-service/rest_ws/ckEditorUtils/imageUtils/' + uniekFileId + '.' + new RegExp(/(?:\.([^.]+))?$/).exec(file.name)[1]})
                    } );

                    if ( xhr.upload ) {
                        xhr.upload.addEventListener( 'progress', evt => {
                            if ( evt.lengthComputable ) {
                                loader.uploadTotal = evt.total;
                                loader.uploaded = evt.loaded;
                            }
                        } );
                    }
                }

                // Prepares the data and sends the request.
                _sendRequest( file , uniekFileId) {
                    var data = this._createFormDataUpload(file, {'imageID' : uniekFileId})
                    // Send the request.
                    this.xhr.send( data );
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
                };

                //Get servoy fileUpload url
                _getFileUploadURL(){
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
                       if($scope.handlers.onFileUploadedMethodID) {
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
                    return this.loader.file.then( file => new Promise( ( resolve, reject ) => {
                        var uniekFileId = uuidv4();
                        this._initRequest();
                        this._initListeners( resolve, reject, file , uniekFileId);
                        this._sendRequest( file, uniekFileId );
                    }));
                }
            
                // Aborts the upload process.
                abort() {
                    if ( this.xhr ) {
                        this.xhr.abort();
                    }
                }
            }

             /**
              * Function called by AutoSave plugin in CKEditor
              * @param {String} data 
              */
            function forceSaveData( data ) {
                console.log( 'CKEditor save Trigger, saving data');
                $scope.model.dataProviderID = data;
                $scope.svyServoyapi.apply('dataProviderID');
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
             * Mention
             *********************************************/

            function SvyTagConverter(editor) {
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
            
                        return writer.createAttributeElement( 'span', {
                            class: 'mention svy-tag',
                            'data-mention': modelAttributeValue.id,
                            'data-real-value': modelAttributeValue.realValue,
                            'contenteditable': modelAttributeValue.editable
                        }, {
                            // Make mention attribute to be wrapped by other attribute elements.
                            priority: 20,
                            // Prevent merging mentions together.
                            id: modelAttributeValue.uid
                        } );
                    },
                    converterPriority: 'high'
                } );
            }

            function svyTagRenderer(item) {
                const itemElement = document.createElement('span');
                itemElement.classList.add('svy-tag-item');
                itemElement.id = 'mention-list-item-id-' & item.id;
                itemElement.textContent = item.name;

                return itemElement;
            }

            function getFeeds() {
                var result = [];
                for (let i = 0; i < $scope.model.mentionFeeds.length; i++) {
                    const feed = $scope.model.mentionFeeds[i];
                    if (!feed.marker) {
                        console.warn('No marker provided for mention feed');
                        continue;
                    } 
                    result.push(
                        {
                            marker: feed.marker,
                            feed: function(queryText) {
                                if (feed.valueList) {
                                    return new Promise( resolve => {
                                        const list = feed.valueList
                                                    // Filter out the full list of all items to only those matching the query text.
                                                    .filter( (item) => {
                                                        const searchString = queryText.toLowerCase();
                                                        return item.displayValue.toString().toLowerCase().includes(searchString);
                                                    } )
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
                            itemRenderer: svyTagRenderer
                        }
                    )
                }
                return result;
            }

            /*********************************************
             * Placeholder
             *********************************************/

            function getPlaceholderItems() {
                var result = {};
                if ($scope.model.toolbar && $scope.model.toolbar.items && $scope.model.toolbar.items.length > 0) {
                    var placeHolderItem = $scope.model.toolbar.items.filter((item) => {
                        return item.type === 'servoyPlaceholder';
                    });
                    if (placeHolderItem && placeHolderItem.length > 0) {
                        placeHolderItem = placeHolderItem[0];
                        return {
                                name: placeHolderItem.name || 'Placeholder',
                                label: placeHolderItem.label,
                                withText: placeHolderItem.withText,
                                isEnabled: placeHolderItem.isEnabled,
                                withTooltip: placeHolderItem.tooltip || null,
                                icon: placeHolderItem.iconSvg || null,
                                values: !placeHolderItem.valueList ? null : placeHolderItem.valueList
                                        .map((item) => {
                                            return { 
                                                name: item.displayValue.toString(), 
                                                dataProvider: item.realValue
                                            }
                                        })
                            };
                    }
                }
                return result;
            }

             /*********************************************
             * Toolbar
             *********************************************/

             /**
              * Returns all custom servoy toolbar items
              */
            function getSvyToolbarItems() {
                if ($scope.model.toolbar && $scope.model.toolbar.items && $scope.model.toolbar.items.length > 0) {
                    return $scope.model.toolbar.items.filter((item) => {
                        return item.type === 'servoyToolbarItem';
                    }).map((item) => {
                        return {
                            name: item.name,
                            label: item.label,
                            withText: item.withText || false,
                            isEnabled: item.isEnabled || false,
                            tooltip: item.tooltip || null,
                            icon: item.iconSvg || null,
                            onClick: item.onClick ? (buttonView) => { $window.executeInlineScript(item.onClick.formname, item.onClick.script) } : null
                        }
                    })
                }
            }

            /**
             * Generate Toolbar menubar items
             * @returns {Array<String>}
             */
            function getToolbarItems() {
                if ($scope.model.toolbar && $scope.model.toolbar.items && $scope.model.toolbar.items.length > 0) {
                    return $scope.model.toolbar.items.map((item) => {
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
                } else {
                    //When nothing defined take default:
                    items = [
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
                        'highlight',
                        '|',
                        'alignment',
                        '|',
                        'numberedList',
                        'bulletedList',
                        'TodoList',
                        '|',
                        'indent',
                        'outdent',
                        '|',
                        'link',
                        'pageBreak',
                        'blockquote',
                        'imageUpload',
                        'insertTable',
                        'mediaEmbed',
                        '|',
                        'undo',
                        'redo'
                    ]
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
            /*********************************************
             * Init & Setup CKEditor
             *********************************************/

            var config = {
                fontSize:{
                    options: [5, 5.5, 6.5, 7.5, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 62]
                },
                autosave: {
                    save( editor ) {
                        return new Promise( resolve => {
                            setTimeout( () => {
                                forceSaveData( editor.getData() )
                                resolve();
                            }, 200 );
                        } );
                    }
                },
                extraPlugins: [SvyTagConverter], 
                mention: {
                    feeds: getFeeds()
                },
                language: getCurrentLanguage(),
                image: {
                    toolbar: [
                        'imageTextAlternative',
                        'imageStyle:full'
                    ]
                },
                svyToolbarItems: getSvyToolbarItems(),
                svyPlaceholderConfig: getPlaceholderItems(),
                toolbar: {
                   items: getToolbarItems(),
                   shouldNotGroupWhenFull: $scope.model.toolbar && $scope.model.toolbar.shouldNotGroupWhenFull ? true : false
                },
                table: {
                    contentToolbar: [
                        'tableColumn',
                        'tableRow',
                        'mergeTableCells',
                        'tableCellProperties',
                        'tableProperties'
                    ]
                },
                licenseKey: ''
            }

            if (!$scope.svyServoyapi.isInDesigner()) {
                DecoupledEditor.create( document.querySelector('.ckeditor'), config).then(editor => {
                    $scope.editor = editor;

                    const view = editor.editing.view;
                    const viewDocument = view.document;
                    
                    if ($scope.model.showInspector == true) {
                        CKEditorInspector.attach( editor )
                    }

                    // Set a custom container for the toolbar.
                    // if($scope.model.menubar) {
                        document.querySelector( '.document-editor__toolbar' ).appendChild( editor.ui.view.toolbar.element );
                        document.querySelector( '.ck-toolbar' ).classList.add( 'ck-reset_all' );
                    // }
                    
                    const setData = () => {
                        const data = editor.getData();
                        const value = $scope.model.dataProviderID||''
                        if(data !== value) {
                            editor.setData(value);
                        }
                    }

                    $scope.$watch('model.dataProviderID', (newVal, oldVal) => {
                        console.log( 'Update CKEditor Context: The data has changed from external!' );
                        setData();
                    })

                    editor.plugins.get( 'FileRepository' ).createUploadAdapter = ( loader ) => {
                        return new ServoyUploadAdapter( loader );
                    };

                    if($scope.model.overWriteTabForEditor == true) {
                        viewDocument.on( 'keydown', ( evt, data ) => {
                            if( (data.keyCode == 9) && viewDocument.isFocused ){
                                // $scope.editor.execute( 'input', { text: "\t" } );
                                editor.execute( 'input', { text: "     " } );
                        
                                evt.stop(); // Prevent executing the default handler.
                                data.preventDefault();
                                view.scrollToTheSelection();
                            }
                        } );                    
                    }

                    console.log(editor.config.plugins.map( plugin => plugin.pluginName ));

                }).then(() => {
                    // data can already be here, if so call the modelChange function so
                    // that it is initialized correctly. (After init of CKEditor)
                    var modelChangFunction = $scope.model[$sabloConstants.modelChangeNotifier];
                    for (var key in $scope.model) {
                        modelChangFunction(key, $scope.model[key]);
                    }

                    
                })
                .catch( function(error) {
                    console.error( error );
                });
            }

            /*********************************************
             * Init & Setup CKEditor
             *********************************************/
            /**
             * Force the autosave trigger of the editor to get all latest changes
             * @example %%prefix%%%%elementName%%.saveData();
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
             * @example %%prefix%%%%elementName%%.addInputAtCursor(input);
             * @param {String} input
             * @returns {Boolean}
             */
            $scope.api.addInputAtCursor = function(input) {
                if(input) {
                    if($scope.model.readOnly == true) {
                        return false;
                    }
                    $scope.editor.execute('input', { text: input })
                }
                return true;
            }

            /**
             * Add tag to current cursor position, will return false when in readOnly mode
             * @example %%prefix%%%%elementName%%.addTagAtCursor(tag);
             * @param {String} tag
             * @returns {Boolean}
             */
            $scope.api.addTagAtCursor = function(tag) {
                if(tag) {
                    if($scope.model.readOnly == true) {
                        return false;
                    }

                    $scope.editor.execute('mention', { marker: $scope.model.tagsStartChar.toString(), mention:  $scope.model.tagsStartChar.toString() + tag.toString() } );
                }
                return true;
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
      templateUrl: 'ckeditor/documenteditor/documenteditor.html'
    };
  }])