#!/usr/bin/env bash
# Installe le relais sur un serveur Ubuntu neuf (Oracle Cloud Always Free).
# Usage, sur le serveur : sudo bash install.sh
# Rejouable sans risque : la clé du relais existante est conservée.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "À lancer avec sudo." >&2
  exit 1
fi

HERE="$(cd "$(dirname "$0")" && pwd)"
KEY_FILE=/etc/caddy/relay-key

# 1. Caddy, depuis le dépôt officiel (https://caddyserver.com/docs/install).
if ! command -v caddy >/dev/null; then
  apt-get update
  apt-get install --yes debian-keyring debian-archive-keyring apt-transport-https curl gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install --yes caddy
fi

# 2. Pare-feu de la machine : les images Ubuntu d'Oracle rejettent tout sauf
#    SSH. On ouvre 80 (validation du certificat) et 443, avant la règle REJECT.
for port in 80 443; do
  if ! iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null; then
    reject_line=$(iptables -L INPUT --line-numbers -n | awk '$2 == "REJECT" { print $1; exit }')
    iptables -I INPUT "${reject_line:-1}" -p tcp --dport "$port" -m state --state NEW -j ACCEPT
  fi
done
if command -v netfilter-persistent >/dev/null; then
  netfilter-persistent save
fi

# 3. Adresse : sslip.io fait pointer <ip-en-tirets>.sslip.io vers l'IP, ce qui
#    donne un nom de domaine gratuit pour le certificat HTTPS.
ip=$(curl -fsS https://api.ipify.org)
domain="${ip//./-}.sslip.io"

# 4. Clé du relais, générée une fois.
if [[ ! -s $KEY_FILE ]]; then
  openssl rand -hex 32 > "$KEY_FILE"
fi
chown root:caddy "$KEY_FILE"
chmod 640 "$KEY_FILE"
key=$(cat "$KEY_FILE")

sed -e "s/__DOMAIN__/$domain/" -e "s/__RELAY_KEY__/$key/" \
  "$HERE/Caddyfile.template" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload-or-restart caddy

cat <<MSG

Relais installé.
  IP à déclarer dans la clé Supercell : $ip
  CLASH_API_BASE (secret Cloudflare)  : https://$domain/v1
  RELAY_KEY      (secret Cloudflare)  : $key
MSG
