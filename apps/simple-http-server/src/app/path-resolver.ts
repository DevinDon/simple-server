import { Stats } from 'fs';
import { readdir, stat } from 'fs/promises';
import { basename, extname, join } from 'path';
import { mimeTypeResolver } from './mime-type-resolver';

// 不使用同步的 existsSync
const isPathExists = async (path: string): Promise<Stats | false> =>
  stat(path).catch(() => false);

export type PathType = FileType | DirType;

export type FileType = {
  type: 'file';
  filename: string;
  extname: string;
  path: string;
  mimeType: string;
};

export type DirType = {
  type: 'dir';
  dirname: string;
  path: string;
  filelist: PathType[];
};

export const resolvePathType = async (path: string): Promise<PathType | null> => {

  const state = await isPathExists(path);

  if (!state) {
    return null;
  }

  if (state.isDirectory()) {
    const list = await readdir(path);
    return {
      type: 'dir',
      dirname: basename(path),
      path,
      filelist: await Promise.all(
        list.map(
          filename => resolvePathType(join(path, filename)),
        ),
      ),
    };
  } else if (state.isFile()) {
    const ext = extname(path);
    return {
      type: 'file',
      filename: basename(path),
      extname: ext,
      path,
      mimeType: mimeTypeResolver(ext),
    };
  }

  throw new Error('Unknown file type');

};
