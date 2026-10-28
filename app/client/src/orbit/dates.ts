// Petits utilitaires de dates (format AAAA-MM-JJ, heure locale) pour les écrans Activité et Terrain.
export const toDate = (value: string) => new Date(`${value}T00:00:00`);
export const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const addDays = (value: string, days: number) => { const date = toDate(value); date.setDate(date.getDate() + days); return isoDate(date); };
export const mondayOf = (value: string) => { const date = toDate(value); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return isoDate(date); };
export const shortDay = (value: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(toDate(value)).replace(".", "");
export const dayTitle = (value: string) => { const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(toDate(value)); return label.charAt(0).toUpperCase() + label.slice(1); };
