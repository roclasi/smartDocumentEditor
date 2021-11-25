
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import {SmartDocumentEditor} from './smartdocumenteditor/smartdocumenteditor';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
 
@NgModule({
    declarations: [
        SmartDocumentEditor
    ],
    providers: [],
    imports: [
        CommonModule,
        CKEditorModule
    ],
    exports: [ 
        SmartDocumentEditor
      ]
})
export class SmartDocumentEditorModule {}
