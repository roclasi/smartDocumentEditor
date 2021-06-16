
import { NgModule } from '@angular/core';
import {SmartDocumentEditor} from './smartdocumenteditor/smartdocumenteditor';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
 
@NgModule({
    declarations: [
        SmartDocumentEditor
    ],
    providers: [],
    imports: [
        CKEditorModule
    ],
    exports: [ 
        SmartDocumentEditor
      ]
})
export class SmartDocumentEditorModule {}
