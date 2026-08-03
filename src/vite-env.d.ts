/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Adresse complète de l'API, préfixe de version compris.
   * Ex : https://api.ecole.exemple.ci/api/v1
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
