import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface FichierUpload {
  id: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface FichierResponse {
  success: boolean;
  data: FichierUpload;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  private apiUrl = 'https://api.commecheznous.fr/api/v1';

  constructor(
    private http: HttpClient
  ) {}

  upload(
    file: File,
    type: string
  ): Observable<FichierResponse> {

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    formData.append(
      'type',
      type
    );

    return this.http.post<FichierResponse>(
      this.apiUrl + '/admin/files',
      formData
    );
  }

  getFileUrl(
    fileId: string
  ): string {

    return this.apiUrl + '/files/' + fileId;
  }

  getFileBlobUrl(
    fileId: string
  ): Observable<string> {

    return this.http
      .get(
        '/api/v1/files/' + fileId,
        {
          responseType: 'blob'
        }
      )
      .pipe(
        map(
          blob =>
            URL.createObjectURL(blob)
        )
      );
  }

  supprimer(
    fileId: string
  ): Observable<any> {

    return this.http.delete(
      this.apiUrl +
      '/admin/files/' +
      fileId
    );
  }

}