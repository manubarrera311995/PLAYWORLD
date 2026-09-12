export type EscenaApi = {
  entrada(): Promise<void> | void;
  salida(): Promise<void> | void;
};

export type RutaNombre =
  | "/"
  | "/hook"
  | "/archivo"
  | "/edicion"
  | "/ipod"
  | "/creacion"
  | "/colectiva";
