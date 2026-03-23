# Subir `license-api` a GitHub

## 1) Instala Git (si aún no lo tienes)

- Descarga **Git for Windows**: https://git-scm.com/download/win  
- Durante el instalador, deja la opción **“Git from the command line and also from 3rd-party software”**.
- Cierra y vuelve a abrir la terminal (PowerShell o CMD).

Comprueba:

```powershell
git --version
```

---

## 2) Crea el repositorio vacío en GitHub

1. Entra en https://github.com/new  
2. **Repository name**: por ejemplo `ventas-express-license-api`  
3. **Public** (vale para Vercel gratis).  
4. **No** marques “Add a README” (ya tienes uno en la carpeta).  
5. Pulsa **Create repository**.

GitHub te mostrará una URL. Ejemplo:

`https://github.com/TU_USUARIO/ventas-express-license-api.git`

---

## 3) Sube la carpeta desde PowerShell

Abre PowerShell y ejecuta (cambia `TU_USUARIO` y el nombre del repo si es distinto):

```powershell
cd C:\Users\User\ingresos-reparaciones\license-api

git init
git add -A
git commit -m "API de licencias para Vercel"

git branch -M main
git remote add origin https://github.com/TU_USUARIO/ventas-express-license-api.git
git push -u origin main
```

La primera vez GitHub pedirá iniciar sesión: usa **usuario + token** (no la contraseña de la cuenta).  
Crea un token en: **GitHub → Settings → Developer settings → Personal access tokens**.

---

## Alternativa: GitHub Desktop

1. Instala **GitHub Desktop**: https://desktop.github.com/  
2. **File → Add local repository** → elige la carpeta  
   `C:\Users\User\ingresos-reparaciones\license-api`  
3. Si pide crear repo, **crea** el commit inicial.  
4. **Publish repository** y elige tu cuenta y el nombre del repo.

---

## Siguiente paso: Vercel

En Vercel: **Add New Project** → **Import** el repo `ventas-express-license-api` → Deploy.  
Luego configura `REVOKED_LICENSE_IDS` en **Environment Variables**.
