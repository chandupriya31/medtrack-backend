import os
import sys
from textwrap import dedent

TEMPLATE = """
server {{
    listen 80;
    listen [::]:80;
    server_name {domain};

    root /usr/share/nginx/html;
    index index.html index.htm;
    
    location /health {{
        return 200 "healthy";
        add_header Content-Type text/plain;
    }}

    location / {{
        proxy_pass http://localhost:{port};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }}
}}
"""

def generate_conf(domain, port=3001, output_dir="/etc/nginx/conf.d"):
    os.makedirs(output_dir, exist_ok=True)

    conf_content = TEMPLATE.format(domain=domain, port=port)
    file_name = f"{domain}.conf"
    file_path = os.path.join(output_dir, file_name)

    with open(file_path, "w") as f:
        f.write(dedent(conf_content).strip() + "\n")

    print(f"✅ Nginx config created: {file_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_nginx_conf.py <domain> [port]")
        print("Example: python generate_nginx_conf.py ccuat.tricubeinnosoft.com 3000")
        sys.exit(1)

    domain = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 3000

    generate_conf(domain, port)

    # Run certbot to obtain SSL certificate for the domain
    print(f"\nNow obtaining SSL certificate for {domain}...")
    certbot_cmd = f"sudo certbot --nginx -d {domain}"
    result = os.system(certbot_cmd)
    if result == 0:
        print(f"✅ SSL certificate obtained for {domain}!")
    else:
        print(f"❌ Failed to obtain SSL certificate for {domain}. Please check certbot output.")

# python3 generate_nginx_conf.py medtrack.srinidhi.co 3001
# sudo systemctl reload nginx