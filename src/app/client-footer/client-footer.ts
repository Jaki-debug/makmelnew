import { Component } from '@angular/core';

@Component({
selector: 'app-client-footer',
standalone: false,
templateUrl: './client-footer.html',
styleUrl: './client-footer.css'
})
export class ClientFooter {

annee = new Date().getFullYear();

}