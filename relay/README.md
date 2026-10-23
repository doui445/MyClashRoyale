# Relais à IP fixe

Supercell n'accepte une clé d'API que depuis des adresses IP déclarées à
l'avance. Les fonctions Cloudflare n'ont pas d'IP fixe : elles passent donc par
ce relais, un petit serveur dont l'IP, elle, ne change pas.

```
iPhone → fonction Cloudflare (détient la clé Supercell)
       → relais (IP fixe, vérifie X-Relay-Key)
       → api.clashroyale.com
```

Le relais est un simple [Caddy](https://caddyserver.com) configuré par
`Caddyfile.template` :

- il ne détient **aucune** clé Supercell ;
- il n'accepte que des `GET` sur `/v1/*` portant la bonne clé de relais
  (`X-Relay-Key`) ; tout le reste reçoit `403` ;
- son HTTPS est automatique, avec un nom gratuit `<ip-en-tirets>.sslip.io`.

## Mise en place (une fois)

### 1. Le serveur (Oracle Cloud, offre « Always Free »)

1. Créer un compte sur https://www.oracle.com/cloud/free/. Une carte bancaire
   est demandée pour vérifier l'identité ; l'offre Always Free n'est pas
   facturée. Choisir une région proche (Paris, Marseille, Francfort…) : on ne
   peut plus la changer ensuite.
2. **Compute → Instances → Create instance** :
   - Image : **Canonical Ubuntu** (dernière version LTS) ;
   - Shape : **VM.Standard.E2.1.Micro** (marquée « Always Free eligible ») ;
   - Réseau : laisser créer un réseau et un sous-réseau **public**, avec
     « Assign a public IPv4 address » coché ;
   - SSH : **Generate a key pair for me**, puis **Save private key**.
3. Ouvrir les ports web : sur la page de l'instance, cliquer le sous-réseau,
   puis sa **Security List** par défaut → **Add Ingress Rules** : source
   `0.0.0.0/0`, protocole TCP, ports de destination `80,443`.
4. Noter l'**adresse IP publique** de l'instance.

### 2. Installer le relais

Depuis le Mac, à la racine du projet :

```bash
chmod 600 ~/Downloads/ssh-key-*.key
scp -i ~/Downloads/ssh-key-*.key -r relay ubuntu@<IP>:
ssh -i ~/Downloads/ssh-key-*.key ubuntu@<IP> 'sudo bash relay/install.sh'
```

Le script installe Caddy, ouvre le pare-feu de la machine, génère la clé du
relais et affiche à la fin les trois valeurs à reporter. Il peut être relancé
sans risque (la clé est conservée).

### 3. Brancher l'app

1. Sur https://developer.clashroyale.com, créer une clé de **production** avec
   l'IP du serveur.
2. Cloudflare → projet `mycr` → **Settings → Variables and Secrets**, en
   **Secret** :
   - `CLASH_API_TOKEN` : la clé de production ;
   - `CLASH_API_BASE` : `https://<ip-en-tirets>.sslip.io/v1` ;
   - `RELAY_KEY` : la clé affichée par le script.
3. Redéployer.

L'adresse du relais et sa clé restent des secrets : le dépôt est public.

## Entretien

- Ubuntu installe seul ses mises à jour de sécurité ; Caddy se met à jour avec
  `sudo apt upgrade`.
- L'IP reste celle de l'instance tant qu'on ne la **supprime** pas.
- Oracle peut récupérer une instance gratuite jugée inactive. Si le relais
  disparaît, recréer l'instance et refaire les étapes 2 et 3 (nouvelle IP,
  donc nouvelle clé Supercell). Passer le compte en « Pay As You Go » (toujours
  gratuit dans les limites Always Free) supprime ce risque.
- Vérifier le relais : `curl -i https://<ip-en-tirets>.sslip.io/v1/cards` doit
  répondre `403` (pas de clé) — c'est le signe qu'il tourne.
