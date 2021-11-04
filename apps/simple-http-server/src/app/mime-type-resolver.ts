export const mimeTypeResolver = (extname: string): string => {
  switch (extname) {
    case '.js':
    case '.ts':
      return 'application/javascript';
    case '.txt':
      return 'text/plain';
    case '.html':
      return 'text/html';
    default:
      return 'application/octet-stream';
  }
};
