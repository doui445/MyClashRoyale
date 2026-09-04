/** Convertit un nom de carte de l'API en slug stable kebab-case. */
export function toCardSlug(name) {
    return name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // accents
        .toLowerCase()
        .replace(/[.'']/g, '') // ponctuation interne (P.E.K.K.A, Goblin's...)
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
