import os

src_dir = r"c:\xampp\htdocs\pos\resources\pos\src"
found = []

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(".js") or f.endswith(".scss") or f.endswith(".css"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as file:
                content = file.read()
                if "SweetAlert" in content or "sweetalert" in content or "sweet-alert" in content or "remove.png" in content:
                    found.append(path)

print("FOUND FILES:")
for p in found:
    print(p)
