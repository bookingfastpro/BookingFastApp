# 🚨 PROCÉDURE D'URGENCE - VIDER LE CACHE

## ÉTAPE 1 : HARD REFRESH (OBLIGATOIRE)
**Windows/Linux** : `Ctrl + Shift + R`
**Mac** : `Cmd + Shift + R`

## ÉTAPE 2 : VIDER LE CACHE COMPLET
1. Ouvre la console (F12)
2. Va dans l'onglet **Application** (ou **Stockage**)
3. Clique sur **Clear storage** (ou **Effacer le stockage**)
4. Coche TOUTES les cases
5. Clique sur **Clear site data**

## ÉTAPE 3 : REBUILD COMPLET
```bash
# Arrête le serveur (Ctrl+C)
rm -rf dist/
rm -rf node_modules/.vite/
npm run build
npm run preview
```

## ÉTAPE 4 : VÉRIFICATION
1. Ouvre une **fenêtre de navigation privée** (Ctrl+Shift+N)
2. Va sur ton site
3. Ouvre la console (F12)
4. Clique sur "Se connecter"
5. Tu DOIS voir des logs maintenant

---

## ⚠️ SI ÇA NE MARCHE TOUJOURS PAS

Vérifie dans la console :
- Onglet **Network** (Réseau)
- Filtre sur **JS**
- Recharge la page
- Est-ce que les fichiers `.js` se chargent ?
- Y a-t-il des erreurs 404 ou 500 ?
