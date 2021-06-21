import { Component, SimpleChanges, Input, Renderer2, ChangeDetectorRef, ViewChild, Output, EventEmitter, Inject, ElementRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ServoyBaseComponent, BaseCustomObject, IValuelist, JSEvent, ServoyPublicService } from '@servoy/public';
import DecoupledEditor from '../assets/lib/ckeditor';
import * as Inspector from '../assets/lib/inspector';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';

@Component({
    selector: 'smartdocumenteditor-smartdocumenteditor',
    templateUrl: './smartdocumenteditor.html'
})
export class SmartDocumentEditor extends ServoyBaseComponent<HTMLDivElement> {

    public Editor = DecoupledEditor;
    @ViewChild('editor') editorComponent: CKEditorComponent;
    @ViewChild('element', { static: true }) elementRef: ElementRef;
     
    VIEW_TYPE = {
        WEB: 'WEB',
        DOCUMENT: 'DOCUMENT'
    };

    @Input() dataProviderID: any;
    @Input() toolbarItems: Array<ToolbarItem>;
    @Input() showToolbar: boolean;
    @Input() overWriteTabForEditor: boolean;
    @Input() styleClass: string;
    @Input() readOnly: boolean;
    @Input() responsiveHeight: number;
    @Input() visible: boolean;
    @Input() viewType: string;
    @Input() language: string;
    @Input() showInspector: boolean;
    @Input() mentionFeeds: Array<MentionFeed>;
    @Input() editorStyleSheet: string;
    @Input() placeholders: Array<PlaceholderItem>;
    @Input() config: any;
    @Input() placeholderMarker: string;

    @Input() onActionMethodID: (e: JSEvent) => void;
    @Input() onFocusGainedMethodID: (e: JSEvent) => void;
    @Input() onFocusLostMethodID: (e: JSEvent) => void;
    @Input() onFileUploadedMethodID: () => void;
    @Input() onReady: () => void;
    @Input() onError: () => void;
    @Input() onDataChangeMethodID: () => void;

    @Output() dataProviderIDChange = new EventEmitter();

    constructor(renderer: Renderer2, cdRef: ChangeDetectorRef, @Inject(DOCUMENT) private document: Document, private servoyService: ServoyPublicService) {
        super(renderer, cdRef);
    }

    svyOnInit() {
        super.svyOnInit();
        if (this.editorStyleSheet) {
            let url = this.editorStyleSheet;
            url = url.split('?')[0];
            let head = this.document.getElementsByTagName('head')[0];
            let cssHref = this.document.createElement('link');
            cssHref.setAttribute("rel", "stylesheet");
            cssHref.setAttribute("type", "text/css");
            cssHref.setAttribute("href", url);
            head.appendChild(cssHref);
        }
        if (!this.config) {
            this.config = {};
        }
        this.config.toolbar = {
            items: this.getToolbarItems()
        }

        if (!this.config.svyToolbarItems) {
            //make sure custom toolbar items are created
            this.config.svyToolbarItems = this.getSvyToolbarItems();
        }

        if (!this.config.svyPlaceholderConfig) {
            //get config for a possible servoyPlaceholder toolbar entry
            this.config.svyPlaceholderConfig = this.getPlaceholderUIConfig();
        }

        if (!this.config.svyPlaceholderItems) {
            //get config for a servoyPlaceholder items
            this.config.svyPlaceholderItems = this.getPlaceholderItems();
        }

        if (this.placeholderMarker || (this.mentionFeeds && this.mentionFeeds.length)) {
            //add placeholder mention feed
            this.config.mention = {
                feeds: this.getFeeds()
            }

            if (!this.config.hasOwnProperty('extraPlugins') || this.config.extraPlugins.indexOf(this.SvyMentionConverter) === -1) {
                if (this.config.hasOwnProperty('extraPlugins')) {
                    this.config.extraPlugins.push(this.SvyMentionConverter);
                } else {
                    this.config.extraPlugins = [this.SvyMentionConverter];
                }
            }
        }
        if (!this.config.autosave) {
            const _this = this
            this.config.autosave = {
                save(editor) {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            const data = editor.getData();
                            _this.forceSaveData(data)
                            resolve(data);
                        }, 200);
                    });
                }
            }
        }

        if (!this.config.language) {
            this.config.language = this.getCurrentLanguage();
        }
    
        import(`../src/assets/lib/translations/${this.config.language}.js`)
         
        // note The pagination feature is by default enabled only in browsers that are using the Blink engine (Chrome, Chromium, newer Edge, newer Opera). 
        // This behavior can be modified by setting this configuration option to true.
        // config.pagination.enableOnUnsupportedBrowsers
        if (!this.config.pagination) {
            if (this.viewType == this.VIEW_TYPE.DOCUMENT) {
                // TODO does require the pagination plugin ?

                // NOTE: when height is auto, in responsive form cannot use pagination.
                this.config.pagination = {
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

        if (!this.config.licenseKey) {
            // this key is not part of the open source license, can only be used in combination of the Servoy Smart Document component
            this.config.licenseKey = 'jIeCooHjrvzWP3N27U66AHcpmT4bYoBPXCFjmk9gaLHxyCGmQyvkzh6kv+UJvg==';
        }

    }


    svyOnChanges(changes: SimpleChanges) {
        if (changes) {
            for (const property of Object.keys(changes)) {
                const change = changes[property];
                switch (property) {
                    case 'styleClass':
                        if (change.previousValue) {
                            const array = change.previousValue.trim().split(' ');
                            array.filter((element: string) => element !== '').forEach((element: string) => this.renderer.removeClass(this.getNativeElement(), element));
                        }
                        if (change.currentValue) {
                            const array = change.currentValue.trim().split(' ');
                            array.filter((element: string) => element !== '').forEach((element: string) => this.renderer.addClass(this.getNativeElement(), element));
                        }
                        break;
                    case 'viewType':
                        if (change.currentValue == 'DOCUMENT') {
                            if (!this.getNativeElement().classList.contains('ckeditor-documentview')) {
                                this.renderer.addClass(this.getNativeElement(), 'ckeditor-documentview');
                            }
                        } else {
                            this.renderer.removeClass(this.getNativeElement(), 'ckeditor-documentview');
                        }
                        break;
                    case 'readOnly':
                        if (this.editorComponent && this.editorComponent.editorInstance)
                        {
                            this.editorComponent.editorInstance.isReadOnly = change.currentValue;
                        }
                        break;
                    case "responsiveHeight":
                        if (!this.servoyApi.isInAbsoluteLayout()) {

                            if (this.responsiveHeight) {
                                this.renderer.setStyle(this.getNativeElement(), 'height', this.responsiveHeight + 'px');
                            } else {
                                // when responsive height is 0 or undefined, use 100% of the parent container.
                                this.renderer.setStyle(this.getNativeElement(), 'height', '100%');
                            }
                        }
                        break;
                    case 'dataProviderID':
                        if (!change.isFirstChange())
                        {
                            if(this.editorComponent && this.editorComponent.editorInstance.editing.view.document.isFocused) {
                                this.editorComponent.editorInstance.setData( this.dataProviderID || '');
                            }
                        }    
                        break;
                }
            }
        }
        super.svyOnChanges(changes);
    }

    public onEditorReady(editor : any): void {
        const view = editor.editing.view;
        const viewDocument = view.document;

        if (this.showInspector == true) {
            Inspector.attach(editor)
        }

        // Set a custom container for the toolbar
        if (this.showToolbar) {
            const toolbar = this.getNativeElement().querySelector('#toolbar-container');
            if (toolbar.firstChild) toolbar.removeChild(toolbar.firstChild);
            toolbar.appendChild(editor.ui.view.toolbar.element);
            this.getNativeElement().querySelectorAll('.ck-toolbar')[0].classList.add('ck-reset_all');
        }

        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return new ServoyUploadAdapter(loader,this.servoyService.generateUploadUrl(this.servoyApi.getFormName(), this.name, 'onFileUploadedMethodID'), this.onFileUploadedMethodID);
        };

        // Disable the plugin so that no pagination is use are visible.
        if (this.viewType != this.VIEW_TYPE.DOCUMENT) {
            editor.plugins.get('Pagination').isEnabled = false;
        }

        if (this.overWriteTabForEditor == true) {
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

        if (this.onFocusGainedMethodID || this.onFocusLostMethodID) {
            editor.ui.focusTracker.on('change:isFocused', (evt, data, isFocused) => {
                if (isFocused) {
                    if (this.onFocusGainedMethodID) {
                        this.onFocusGainedMethodID(this.servoyService.createJSEvent(event, 'focusGained'));
                    }
                } else {
                    if (this.onFocusLostMethodID) {
                        this.onFocusLostMethodID(this.servoyService.createJSEvent(event, 'focusLost'));
                    }
                }
            });
        }

        if (this.onActionMethodID) {
            editor.listenTo(editor.editing.view.document, 'click', (evt) => {
                if (this.readOnly) {
                    this.onActionMethodID(this.servoyService.createJSEvent(event, 'onAction'));
                }
            })
        }
    }

    SvyMentionConverter(editor: any) {
        editor.conversion.for('upcast').elementToAttribute({
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
                    const mentionAttribute = editor.plugins.get('Mention').toMentionAttribute(viewItem, {
                        realValue: viewItem.getAttribute('data-real-value')
                    });
                    return mentionAttribute;
                }
            },
            converterPriority: 'high'
        });

        editor.conversion.for('downcast').attributeToElement({
            model: 'mention',
            view: (modelAttributeValue, { writer }) => {
                // Do not convert empty attributes (lack of value means no mention).
                if (!modelAttributeValue) {
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

                return writer.createAttributeElement(elementType, attributes, {
                    // Make mention attribute to be wrapped by other attribute elements.
                    priority: 20,
                    // Prevent merging mentions together.
                    id: modelAttributeValue.uid
                });
            },
            converterPriority: 'high'
        });
    }

    svyMentionRenderer(item) {
        const itemElement = this.document.createElement('span');
        itemElement.classList.add('svy-mention');
        itemElement.id = 'mention-id-' + item.id;
        itemElement.textContent = item.name;

        return itemElement;
    }

    getFeeds() {
        var result = [];

        //add placeholder mention
        if (this.placeholderMarker) {
            const plcHolderMention = {
                marker: this.placeholderMarker,
                itemRenderer: this.svyMentionRenderer,
                minimumCharacters: 0,
                feed: function(queryText) {
                    var plcHolderItems = this.getPlaceholderItems();
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
                                        id: this.placeholderMarker + item.displayName,
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
        if (this.mentionFeeds) {
            for (let i = 0; i < this.mentionFeeds.length; i++) {
                const feed = this.mentionFeeds[i];
                if (!feed.marker) {
                    console.warn('No marker provided for mention feed');
                    continue;
                }
                result.push(
                    {
                        marker: feed.marker,
                        feed: function(queryText) {
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
                                        editable: feed.itemEditable
                                    }
                                })
                            } else {
                                return [];
                            }
                        },
                        minimumCharacters: feed.minimumCharacters || 0,
                        itemRenderer: this.svyMentionRenderer
                    }
                )
            }
        }
        return result;
    }

    getPlaceholderItems() {
        if (this.placeholders && this.placeholders.length) {
            return this.placeholders.map((placeholderEntry) => {
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

    getPlaceholderUIConfig() {
        if (this.toolbarItems && this.toolbarItems.length > 0) {
            var placeHolderItem = this.toolbarItems.filter((item) => {
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

    getSvyToolbarItems() {
        // FIXME style of icon styleClass is overriden by the ck-reset class; causing issues in showing font icons. This is an known issue of CKEditor
        // https://stackoverflow.com/questions/65605215/prevent-from-being-added-ck-reset-classes-in-ckeditor-5
        if (this.toolbarItems && this.toolbarItems.length > 0) {
            return this.toolbarItems.filter((item) => {
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
                        var jsevent = this.servoyService.createJSEvent(event, 'action');
                        this.servoyService.executeInlineScript(item.onClick.formname, item.onClick.script, [jsevent, item.name, dropDownValue || null])
                    } : null
                }
            })
        }
        return null;
    }

    getToolbarItems(): Array<String> {
        if (this.toolbarItems && this.toolbarItems.length > 0) {
            return this.toolbarItems.map((item) => {
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
            return [
                "previousPage",
                "nextPage",
                "pageNavigation",
                "|",
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
        }
    }

    getCurrentLanguage(): string {
        if (this.language) {
            return this.language;
        }
        var locale = this.servoyService.getLocale();
        if (locale) {
            return locale;
        }
        return 'en';
    }


    forceSaveData(data: string) {
        if (!this.readOnly && this.editorComponent) {
            console.debug( 'Editor save Trigger (ID: ' + this.editorComponent.editorInstance.id + ') , saving data');
            this.dataProviderID = data;
            this.dataProviderIDChange.emit(this.dataProviderID);
        }
    }

    saveData() {
        if (this.editorComponent) {
            this.forceSaveData(this.editorComponent.editorInstance.getData());
            return true;
        }
        return false;
    }

    addInputAtCursor(input: string) {
        if (input) {
            if (this.readOnly == true || !this.editorComponent) {
                return false;
            }
            this.editorComponent.editorInstance.execute('input', { text: input })
        }
        return true;
    }

    addTagAtCursor(marker: string, tag: string): boolean {
        if (tag) {
            if (this.readOnly || !this.editorComponent) {
                return false;
            }

            for (let i = 0; i < this.mentionFeeds.length; i++) {
                if (this.mentionFeeds[i].marker === marker.toString()) {
                    const feed = this.mentionFeeds[i];
                    const list = (feed.valueList||feed.feedItems).filter((item) => {
                        return (item.realValue||item.displayValue).toString() == tag.toString();
                    })
                    if (list.length > 0) {
                        this.editorComponent.editorInstance.execute('mention', {
                            marker: marker.toString(), mention: {
                                name: list[0].displayValue.toString(),
                                id: feed.marker.toString() + list[0].displayValue.toString(),
                                realValue: list[0].realValue,
                                editable: !!feed.itemEditable
                            }
                        });
                        return true;
                    }

                }
            }
        }
        return false;
    }

    executeCommand(command, commandParameters) {
        if (this.editorComponent) {
            this.editorComponent.editorInstance.execute(command, commandParameters);
        }
    }


    insertImage(source) {
        if (this.editorComponent) {
            this.editorComponent.editorInstance.execute('imageInsert', { source: source });
        }
    }

    getHTMLData(withInlineCSS, filterStylesheetName) {
        if (this.editorComponent) {
            var data = '<html><body><div class="ck-content" dir="ltr">' + this.editorComponent.editorInstance.getData() + '</div></body></html>';
            if (withInlineCSS) {
                if (filterStylesheetName) {
                    data = this.Editor.getInlineStyle(data, this.Editor.getCssStyles([filterStylesheetName, this.editorStyleSheet]));
                } else {
                    data = this.Editor.getInlineStyle(data, this.Editor.getCssStyles());
                }
            }
            return data;
        }
        return null;
    }

    getCSSData(filterStylesheetName: boolean) {
        if (filterStylesheetName) {
            return this.Editor.getCssStyles([filterStylesheetName, this.editorStyleSheet]);
        } else {
            return this.Editor.getCssStyles();
        }
    }

    getPrintCSSData() {
        return this.Editor.getPrintCSS();
    }

    showPlaceholderRealData = function(record) {
        this.editorComponent.editorInstance.model.change(writer => {
            const rangeInRoot = writer.createRangeIn(this.editorComponent.editorInstance.model.document.getRoot());

            for (const item of rangeInRoot.getItems()) {
                if (item.name === 'svy-placeholder') {
                    //placeholder item found
                    console.log(item);
                }
            }
        })
    }
}
export class ToolbarItem extends BaseCustomObject {
    name: string;
    type: string;
    label: string;
    withText: boolean;
    keystroke: string;
    styleClass: string;
    isEnabled: boolean;
    withTooltip: boolean;
    tooltip: string;
    iconStyleClass: string;
    onClick: any;
    valueList: IValuelist;
    ignoreReadOnly: boolean;
}

export class MentionFeed extends BaseCustomObject {
    marker: string;
    valueList: IValuelist;
    feedItems: Array<MentionFeedItem>;
    minimumCharacters: number;
    itemEditable: boolean;
}

export class MentionFeedItem extends BaseCustomObject {
    displayValue: string;
    realValue: string;
}

export class PlaceholderItem extends BaseCustomObject {
    displayName: string;
    dataProvider: string;
    format: string;
}

class ServoyUploadAdapter {
    loader: any;
    xhr: XMLHttpRequest;
    reader: FileReader;
    onFileUploadedMethodID: any;
    uploadURL: string;

    constructor(loader, uploadURL, onFileUploadedMethodID) {
        // The file loader instance to use during the upload.
        this.loader = loader;
        this.onFileUploadedMethodID = onFileUploadedMethodID;
        this.uploadURL = uploadURL;
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
        metaFields.forEach(function(item) {
            formPost.append(item, metadata[item]);
        });
        formPost.append('upload', file, file.name);

        return formPost;
    }

    //Get servoy fileUpload url
    _getFileUploadURL() {
        if (this.onFileUploadedMethodID)
            return this.uploadURL;
        return null;
    }

    // Starts the upload process.
    upload() {
        if (!this.onFileUploadedMethodID) {
            //base64 upload
            return new Promise((resolve, reject) => {
                const reader = this.reader = new window.FileReader();

                reader.addEventListener('load', () => {
                    resolve({ default: reader.result });
                });

                reader.addEventListener('error', err => {
                    reject(err);
                });

                reader.addEventListener('abort', () => {
                    reject();
                });

                this.loader.file.then(file => {
                    reader.readAsDataURL(file);
                });
            });
        } else {
            //upload to resources/upload
            return this.loader.file.then(file => new Promise((resolve, reject) => {
                var uniqueFileID = this.uuidv4();
                this._initRequest();
                this._initListeners(resolve, reject, file, uniqueFileID);
                this._sendRequest(file, uniqueFileID);
            }));
        }
    }

    // Aborts the upload process.
    abort() {
        if (!this.onFileUploadedMethodID) {
            this.reader.abort();
        } else if (this.xhr) {
            this.xhr.abort();
        }
    }

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
