/* Public-build data contract: the GitHub Pages version starts empty. Users populate it locally through CSV/XLSX import. */
export type Activation = {
  d: string;
  a: string;
  s: string;
  c: string;
  t: string;
  cl: string;
  n: string;
};

export const activationData: Activation[] = [];
