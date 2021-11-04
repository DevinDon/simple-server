import { createReadStream } from 'fs';
import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { Server as HttpsServer } from 'https';
import { join } from 'path';
import { CERT, KEY } from './cert';
import { resolvePathType } from './path-resolver';
import { renderDir } from './template';

export class SimpleServer {

  // 使用文件的 ctime 作为文件的版本号
  private cache: { [key: string]: number; } = {};

  private httpServer: HttpServer;
  private httpsServer: HttpsServer;

  constructor(
    private rootPath: string = __dirname,
    private enableCORS: boolean = true,
  ) {
    this.httpServer = new HttpServer(this.process.bind(this));
    this.httpsServer = new HttpsServer(
      { cert: CERT, key: KEY },
      this.process.bind(this),
    );
  }

  private async process(request: IncomingMessage, response: ServerResponse) {

    const path = join(this.rootPath, request.url ?? '/');
    const pathType = await resolvePathType(path);

    if (this.enableCORS) {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', '*');
      response.setHeader('Access-Control-Allow-Headers', '*');
    }

    if (pathType === null) {
      response.statusCode = 404;
      response.statusMessage = 'Not Found';
      response.end(`Path "${request.url}" not found`);
    } else if (pathType.type === 'dir') {
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(renderDir(pathType));
    } else if (pathType.type === 'file') {
      response.setHeader('Content-Type', pathType.mimeType);
      response.setHeader('Cache-Control', 'max-age=3600');
      if (pathType.mimeType === 'application/octet-stream') {
        response.setHeader('Content-Disposition', `attachment; filename="${pathType.filename}"`);
      }
      if ((request.headers['cache-control'] ?? '').includes('max-age') && pathType.ctime === this.cache[path]) {
        response.setHeader('Last-Modified', new Date(this.cache[path]).toUTCString());
        response.statusCode = 304;
        response.statusMessage = 'Not Modified';
        response.end();
      } else {
        this.cache[path] = pathType.ctime;
        createReadStream(path).pipe(response);
      }
    } else {
      response.statusCode = 500;
      response.end('Not support file type');
    }

  }

  bootstrap() {
    this.httpServer.listen(8080, () => console.log('[SimpleServer] HTTP Server is listening on port 8080'));
    this.httpsServer.listen(4343, () => console.log('[SimpleServer] HTTPS Server is listening on port 4343'));
  }

}
