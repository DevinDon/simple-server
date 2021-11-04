import { DirType } from './path-resolver';

export const renderDir = (dirType: DirType) => {

  const files = dirType.filelist
    .map(file => file.type === 'dir' ? `目录 ${file.dirname}` : `文件 ${file.filename}`)
    .map(name => `  - ${name}`).join('\n');

  return `
Directory: ${dirType.path}

Files:
${files}
`;

};
