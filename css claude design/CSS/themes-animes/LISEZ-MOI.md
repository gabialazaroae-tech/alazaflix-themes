# Thèmes Jellyfin + module d'animations

Versions enrichies de tes 12 thèmes. **Tes fichiers d'origine (dans `uploads/`) ne sont pas modifiés.**

Chaque fichier `.css` = ton thème d'origine + un module d'animations neutre ajouté à la fin
(révélation au scroll, parallax, reflet glissant sur les affiches, header qui se réduit).
Le module ne touche **ni à tes couleurs ni à tes survols** existants.

## Installation

### 1. Le thème (obligatoire — CSS pur)
Jellyfin → **Tableau de bord → Général → CSS personnalisé** → colle le contenu du thème choisi
(ex. `netflix_style.css`) → Enregistre.

Inclus sans rien de plus :
- ✦ Révélation des rangées quand elles entrent à l'écran
- ✦ Parallax doux sur les images de fond
- ✦ Reflet/brillance qui glisse sur les affiches au survol
- ✦ Header prêt à se masquer (transition + classes)

> Compatible Chrome/Edge récents et lecteurs Android (scroll-driven animations).
> Sur un navigateur plus ancien, le contenu reste affiché normalement, sans bug.

### 2. Effets souris + header auto (optionnel — JS)
Pour l'**inclinaison 3D qui suit la souris** et le **header qui se masque en descendant /
réapparaît en remontant**, ajoute `jellyfin-effects.js` au client web.

La notice d'installation complète est en haut de `jellyfin-effects.js`
(méthode A : index.html du serveur · méthode B : extension navigateur).

## Réglages
Tu peux doser le module directement dans chaque fichier (bloc « MODULE ANIMATIONS » en bas) :
- `jfRevealUp` → amplitude de la montée des rangées
- `jfParallax` → intensité du parallax
- durée du reflet dans `.cardImageContainer::after`

Et pour le JS, en haut de `jellyfin-effects.js` : `MAX_TILT`, `LIFT`, `SCALE`.
