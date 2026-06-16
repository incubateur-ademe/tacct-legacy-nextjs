/**
 * Les binaires des fichiers (images des fiches projet, etc.) ont été rapatriés
 * du serveur legacy dans `public/assets/files/<file_name>` et sont servis en
 * statique. Le `basePath` Next (`/workspace-tacct`) n'étant pas appliqué
 * automatiquement aux `<img src>` bruts, on le préfixe ici (comme le footer).
 */
const FILES_BASE_PATH = '/workspace-tacct/assets/files';

export function fileUrl(fileName: string | null | undefined): string | null {
  return fileName ? `${FILES_BASE_PATH}/${fileName}` : null;
}
